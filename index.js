const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readline = require('readline');

// Configuration
const GEMINI_API_KEY= "AIzaSyCXSUSOWN8dBDcHpbGcUuYUEedD0KCI8FI"

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
// Main function to start the application
async function startGenerator() {
  console.log('🎯 AI Code Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━');
  
  // Check if API key is set
  if (!GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY environment variable not set');
    console.log('💡 Please set your Gemini API key:');
    console.log('   export GEMINI_API_KEY="your-api-key-here"');
    console.log('   Or on Windows: set GEMINI_API_KEY=your-api-key-here');
    return;
  }

  // Get user input
  const userInput = await askUserInput();
  
  if (!userInput || userInput.trim() === '') {
    console.log('❌ Please provide a description of what you want to build.');
    return;
  }

  console.log(`📝 Building: "${userInput}"`);
  
  try {
    // Generate code using Gemini AI
    const generatedCode = await generateWithGemini(userInput);
    
    // Parse the response to extract files
    const files = parseGeneratedCode(generatedCode);
    
    if (Object.keys(files).length === 0) {
      console.error('❌ Could not extract files from AI response');
      return;
    }

    // Create project folder and files
    const projectName = createProjectName(userInput);
    createProjectFiles(projectName, files);
    
    // Success message
    console.log('\n✅ Project created successfully!');
    console.log(`📁 Location: ./${projectName}/`);
    console.log(`📄 Files: ${Object.keys(files).join(', ')}`);
    console.log('\n🌐 To view your app:');
    console.log(`   cd ${projectName}`);
    console.log(`   open index.html`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Function to get user input
function askUserInput() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('What would you like to build? (e.g., "calculator", "todo app", "weather widget"): ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Function to create the prompt for Gemini AI
function createGeminiPrompt(userRequest) {
  return `Create a complete web application: ${userRequest}

Please provide the code in exactly this format:

===HTML===
[Complete HTML code here]
===HTML===

===CSS===
[Complete CSS code here]  
===CSS===

===JS===
[Complete JavaScript code here]
===JS===

Requirements:
- Make it fully functional and interactive
- Use modern, clean design
- Make it responsive
- Use only vanilla HTML, CSS, and JavaScript
- No external libraries
- Make sure all files work together perfectly`;
}

// Function to call Gemini API
async function generateWithGemini(userRequest) {
  console.log('🤖 Generating code with AI...');
  
  const prompt = createGeminiPrompt(userRequest);
  
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response from Gemini API');
    }
  } catch (error) {
    if (error.response?.data) {
      console.error('API Error:', error.response.data);
    }
    throw new Error('Failed to generate code: ' + error.message);
  }
}

// Function to parse the AI response and extract files
function parseGeneratedCode(response) {
  const files = {};
  
  // Parse HTML
  const htmlMatch = response.match(/===HTML===([\s\S]*?)===HTML===/);
  if (htmlMatch) {
    files['index.html'] = htmlMatch[1].trim();
  }

  // Parse CSS  
  const cssMatch = response.match(/===CSS===([\s\S]*?)===CSS===/);
  if (cssMatch) {
    files['style.css'] = cssMatch[1].trim();
  }

  // Parse JavaScript
  const jsMatch = response.match(/===JS===([\s\S]*?)===JS===/);
  if (jsMatch) {
    files['script.js'] = jsMatch[1].trim();
  }

  // Fallback parsing if markers not found
  if (Object.keys(files).length === 0) {
    console.log('⚠️ Using fallback parsing...');
    
    const codeBlocks = response.match(/```[\s\S]*?```/g) || [];
    
    codeBlocks.forEach((block) => {
      const content = block.replace(/```\w*\n?/, '').replace(/```$/, '').trim();
      
      if (content.includes('<!DOCTYPE') || content.includes('<html')) {
        files['index.html'] = content;
      } else if (content.includes('body {') || content.includes('{') && content.includes('}')) {
        files['style.css'] = content;
      } else if (content.includes('function') || content.includes('document.') || content.includes('const ')) {
        files['script.js'] = content;
      }
    });
  }

  return files;
}

// Function to create a clean project name
function createProjectName(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'my-project';
}

// Function to create project folder and files
function createProjectFiles(projectName, files) {
  const projectPath = path.join(process.cwd(), projectName);
  
  // Create project directory
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
  }

  // Write all files
  Object.entries(files).forEach(([fileName, content]) => {
    const filePath = path.join(projectPath, fileName);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Created ${fileName}`);
  });
}

// Start the application
if (require.main === module) {
  startGenerator().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

// test prompt - build me a simple portfolio website i am a mobile developer who knows react native and flutter i am a professional with trained experience of 2+ years