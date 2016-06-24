'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "terminal" is now active!');

    let terminal = new Terminal();

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('terminal.run', () => {
        // The code you place here will be executed every time your command is executed        
        terminal.run();
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

/**
 * Terminal
 */
class Terminal {
    private _outputChannel;

    constructor() {
        this._outputChannel = vscode.window.createOutputChannel('Terminal');
    }

    public run() {       
        let commands = this.getCommands();
        if (commands.length == 0)
        {
            vscode.window.showInformationMessage('No commands found or selected.');
            return;
        }

        this.ExecuteCommands(commands);
    }

    private getCommands(): string[] {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return [];
        }

        let selection = editor.selection;
        let text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
        let commands = text.trim().split(/\s*[\r\n]+\s*/g).filter(this.filterEmptyString);

        return commands;
    }

    private filterEmptyString(value: string): boolean {
        return value.length > 0;
    }

    private ExecuteCommands(commands: string[]) {
        this._outputChannel.show();
        this.ExecuteCommand(commands, 0);
    }

    private ExecuteCommand(commands: string[], index: number) {
        if (index < commands.length) {
            let exec = require('child_process').exec;
            this._outputChannel.appendLine('>> ' +　commands[index]);
            let process = exec(commands[index]);

            process.stdout.on('data', (data) => {               
                this._outputChannel.append(data);
            });

            process.stderr.on('data', (data) => {
                this._outputChannel.append(data);
            });

            process.on('close', (code) => { 
                this._outputChannel.appendLine('');
                this.ExecuteCommand(commands, index+1);
            });
        }
    }
}