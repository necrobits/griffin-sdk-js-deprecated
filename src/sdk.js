(function () {
    class GriffinJS {
        constructor() {
            this.initialized = false;
            this.profile = null;
            this.token = null;
            this.dialog = null;
            this.dialogPoller = null;
        }

        init(
            {
                server,
                containerId,
                appId,
                dialogTitle,
                login,
                logout
            } = {}) {
            if (!server) {
                throw new Error("appId must be specified");
            }
            this.serverUrl = server;
            this.dialogTitle = dialogTitle || 'Griffin SSO';
            if (!appId) {
                throw new Error("appId must be specified");
            }
            this.loginUrl = `${this.serverUrl}${login}?client_id=${appId}&response_type=token`;
            this.logoutUrl = `${this.serverUrl}${logout}`;
            this.containerId = containerId || 'griffin-init';
            window.addEventListener('message', this._handleMessage.bind(this));
            this.initialized = true;
        }

        // Callback (profile, token)
        getLoginStatus(callbackFn) {
            this._checkState();
            const iframe = this._createIframe(this.loginUrl);
            iframe.addEventListener('load', () => {
                if (callbackFn) callbackFn(this.profile, this.token);
                this._clear();
            })
        }

        login(successCallback, errorCallback) {
            const w = 450;
            const h = 560;
            const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
            const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;
            const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
            const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
            const systemZoom = width / window.screen.availWidth;
            const left = (width - w) / 2 / systemZoom + dualScreenLeft;
            const top = (height - h) / 2 / systemZoom + dualScreenTop;
            this.dialog = window.open(this.loginUrl, this.dialogTitle,
                `directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,
           width=${w/systemZoom},height=${h/systemZoom},top=${top},left=${left}`);
            this.dialogPoller = setInterval(() => {
                if (this.dialog && this.dialog.closed) {
                    clearInterval(this.dialogPoller);
                    if (this.token != null && successCallback) {
                        successCallback(this.profile, this.token);
                    }
                    if (this.token == null && errorCallback) {
                        errorCallback();
                    }
                }
            }, 500);
            this.dialog.window.focus();
        }

        logout(callbackFn) {
            this._checkState();
            const iframe = this._createIframe(`${this.logoutUrl}`);
            iframe.addEventListener('load', () => {
                if (callbackFn) callbackFn();
                this._clear();
            });
        }

        _handleMessage(event) {
            if (event.origin.startsWith(this.serverUrl) && event.data.length > 0) {
                if (event.data.startsWith('griffin.sso.token')) {
                    this._onLoggedIn(event.data.split('=')[1]);
                } else {
                    this._onLoggedOut();
                }
            }
        }

        _onLoggedIn(token) {
            const claims = JSON.parse(atob(token.split('.')[1]));
            delete claims['sub'];
            delete claims['exp'];
            delete claims['aud'];
            delete claims['iat'];
            delete claims['iss'];
            delete claims['nbf'];
            delete claims['jti'];
            delete claims['oaud'];
            this.profile = claims;
            this.token = token;
            if (this.dialog) {
                this.dialog.window.close();
            }
        }

        _onLoggedOut() {
            this.profile = null;
            this.token = null;
        }

        _createIframe(url) {
            this._clear();
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = url;
            document.getElementById(this.containerId).appendChild(iframe);
            return iframe;
        }

        _clear() {
            document.getElementById(this.containerId).innerHTML = '';
        }

        _checkState() {
            if (!this.initialized) {
                throw new Error("Griffin.init() must be called in your script first");
            }
        }

    }

    Griffin = new GriffinJS();
})();