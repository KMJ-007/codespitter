import * as vscode from 'vscode';

import spitOutThatCode from './spitOutThatCode';

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('VSCodeExtensionBoilerplate.printMyCode', () =>
            spitOutThatCode(),
        ),
    );
}

export function deactivate(): void {
    // recycle resource...
}
