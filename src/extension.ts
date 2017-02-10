'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { AppInsightsClient } from './appInsightsClient';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "terminal" is now active!');

    let terminal = new Terminal();

    let run = vscode.commands.registerCommand('terminal.run', () => {
        terminal.run();
    });

    let stop = vscode.commands.registerCommand('terminal.stop', () => {
        terminal.stop();
    });

    let open = vscode.commands.registerCommand('terminal.open', (fileUri) => {
        terminal.open(fileUri);
    });

    context.subscriptions.push(run);
    context.subscriptions.push(stop);
    context.subscriptions.push(open);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

/**
 * Terminal
 */
class Terminal {
    private _outputChannel: vscode.OutputChannel;
    private _isRunning: boolean;
    private _process;
    private _appInsightsClient: AppInsightsClient;

    constructor() {
        this._outputChannel = vscode.window.createOutputChannel('Terminal');
        this._outputChannel.appendLine('[Notice] This extension will have limited updates in the future, try Code Runner: https://marketplace.visualstudio.com/items?itemName=formulahendry.code-runner with more functions and supports!');
        this._outputChannel.appendLine('');
        this._appInsightsClient = new AppInsightsClient();
    }

    public run(): void {
        this._appInsightsClient.sendEvent("run");
        if (this._isRunning) {
            vscode.window.showInformationMessage('Command(s) are already running!');
            return;
        }

        let commands = this.getCommands();
        if (commands.length == 0) {
            vscode.window.showInformationMessage('No commands found or selected.');
            return;
        }

        this._isRunning = true;
        this.ExecuteCommands(commands);
    }

    public stop(): void {
        this._appInsightsClient.sendEvent("stop");
        if (this._isRunning) {
            this._isRunning = false;
            let kill = require('tree-kill');
            kill(this._process.pid);
            this._outputChannel.appendLine('');
            this._outputChannel.appendLine('Command(s) stopped.');
        }
    }

    public open(fileUri?: vscode.Uri): void {
        let filePath: string;
        if (!fileUri || typeof fileUri.fsPath !== 'string') {
            let activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && !activeEditor.document.isUntitled) {
                filePath = activeEditor.document.fileName;
            }
        } else {
            filePath = fileUri.fsPath;
        }

        this._appInsightsClient.sendEvent("open");
        let terminal = vscode.window.createTerminal();
        terminal.show(false);
        if (filePath) {
            terminal.sendText(`cd "${path.dirname(filePath)}"`);
        }
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
        this._outputChannel.show(true);
        this.ExecuteCommand(commands, 0);
    }

    private ExecuteCommand(commands: string[], index: number) {
        if (index >= commands.length) {
            this._isRunning = false;
            return;
        }
        if (this._isRunning) {
            let exec = require('child_process').exec;
            this._outputChannel.appendLine('>> ' + commands[index]);
            this._process = exec(commands[index]);

            this._process.stdout.on('data', (data) => {
                this._outputChannel.append(data);
            });

            this._process.stderr.on('data', (data) => {
                this._outputChannel.append(data);
            });

            this._process.on('close', (code) => {
                this._outputChannel.appendLine('');
                this.ExecuteCommand(commands, index + 1);
            });
        }
    }
}