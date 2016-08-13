'use strict';
import * as vscode from 'vscode';

const appInsights = require("applicationinsights");

export class AppInsightsClient {
    private _client;
    private _enableAppInsights;

    constructor() {
        this._client = appInsights.getClient("ee8f29f9-bc83-42d1-ab28-2762fe50dd31");
        let config = vscode.workspace.getConfiguration('terminal');
        this._enableAppInsights = config.get<boolean>('enableAppInsights');
    }

    public sendEvent(eventName: string): void {
        if (this._enableAppInsights) {
            this._client.trackEvent(eventName);
        }
    }
}