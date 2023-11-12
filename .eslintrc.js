module.exports = {
    "env": {
        "es2017": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "overrides": [
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": "off",
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "max-len": ["error", { code: 100 }],
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
            "error",
            { 
                "argsIgnorePattern": "^_",
                "destructuredArrayIgnorePattern": "^_" 
            }
        ],
        "@typescript-eslint/no-explicit-any": "warn",
        "object-curly-spacing": ["error", "always"],
        "arrow-spacing" : [ "error", { "before": true, "after": true } ],
        "comma-spacing": [ "error", {  "before": false,  "after": true  } ],
        "no-multiple-empty-lines": [ "error", { "max": 2, "maxEOF": 0 } ],
        "no-whitespace-before-property": "error"
    },
    root: true,
  }