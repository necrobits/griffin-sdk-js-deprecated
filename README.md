# Griffin Javascript SDK

## Installation

Copy **sdk.min.js** to your project, then add this at the end of your <body>
```html
<script src="sdk.min.js"></script>
```
## Usage

GriffinSDK must be initialized with 

```js
Griffin.init({
    appId: 'your-app-id',
    server: 'https://example.com',
    login: '/sso/login',
    logout: '/sso/logout'
});
```
