// Import required dependencies
import { GoogleGenAI } from "@google/genai";
import readlineSync from 'readline-sync';
import { exec } from "child_process";
import { promisify } from "util";
import os from 'os';

// Get current operating system platform
const platform = os.platform();

// Convert exec to promise-based function
const asyncExecute = promisify(exec);

// Store conversation history for AI context
const History = [];

// Gemini AI configuration
const GEMINI_API_KEY = "use your own api key here dawwwg";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Execute shell commands asynchronously
async function executeCommand({command}) {
    try {
        const {stdout, stderr} = await asyncExecute(command);

        if (stderr) {
            return `Error: ${stderr}`;
        }

        return `Success: ${stdout || 'Task executed completely'}`;
    } catch (error) {
        return `Error: ${error.message}`;
    }
}

// Define tool schema for AI function calling
const executeCommandDeclaration = {
    name: "executeCommand",
    description: "Execute a single terminal/shell command. A command can be to create a folder, file, write on a file, edit the file or delete the file",
    parameters: {
        type: 'OBJECT',
        properties: {
            command: {
                type: 'STRING',
                description: 'It will be a single terminal command. Ex: "mkdir calculator"'
            },
        },
        required: ['command']   
    }
};

// Map available tools for AI to use
const availableTools = {
   executeCommand
};

// Main AI agent function that handles user requests
async function runAgent(userProblem) {
    // Add user input to conversation history
    History.push({
        role: 'user',
        parts: [{text: userProblem}]
    });

    while (true) {
        // Generate AI response with tool capabilities
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: History,
            config: {
                systemInstruction: `You are an Website builder expert. You have to create the frontend of the website by analysing the user Input.
                You have access of tool, which can run or execute any shell or terminal command.

                Current user operation system is: ${platform}
                Give command to the user according to its operating system support.

                <-- What is your job -->
                1: Analyse the user query to see what type of website the want to build
                2: Give them command one by one , step by step
                3: Use available tool executeCommand

                // Now you can give them command in following below
                1: First create a folder, Ex: mkdir "calulator"
                2: Inside the folder, create index.html , Ex: touch "calculator/index.html"
                3: Then create style.css same as above
                4: Then create script.js
                5: Then write a code in html file

                You have to provide the terminal or shell command to user, they will directly execute it

                `,
                tools: [{
                    functionDeclarations: [executeCommandDeclaration]
                }],
            },
        });

        // Check if AI wants to use a tool
        if (response.functionCalls && response.functionCalls.length > 0) {
            console.log(response.functionCalls[0]);
            const {name, args} = response.functionCalls[0];

            // Execute the requested tool
            const funCall = availableTools[name];
            const result = await funCall(args);

            // Prepare function response for AI
            const functionResponsePart = {
                name: name,
                response: {
                    result: result,
                },
            };

            // Add model's function call to history
            History.push({
                role: "model",
                parts: [
                    {
                        functionCall: response.functionCalls[0],
                    },
                ],
            });

            // Add function result to history
            History.push({
                role: "user",
                parts: [
                    {
                        functionResponse: functionResponsePart,
                    },
                ],
            });
        } else {
            // Add AI response to history and display it
            History.push({
                role: 'model',
                parts: [{text: response.text}]
            });
            console.log(response.text);
            break;
        }
    }
}

// Main application entry point
async function main() {
    console.log("I am Devlin: let's create a website");
    const userProblem = readlineSync.question("Ask me anything--> ");
    await runAgent(userProblem);
    main(); // Restart for continuous interaction
}

// Start the application
main();