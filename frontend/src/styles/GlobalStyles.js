import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f6f8fa;
    color: #151b26;
  }

  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
      monospace;
  }
`;

// Asanaカラーパレット
export const colors = {
  primary: '#f06a6a',
  secondary: '#6d6e6f',
  background: '#f6f8fa',
  white: '#ffffff',
  border: '#e1e4e8',
  hover: '#f3f4f6',
  text: {
    primary: '#151b26',
    secondary: '#6d6e6f',
    light: '#9ca6af'
  },
  status: {
    todo: '#e1e4e8',
    inProgress: '#ffc107',
    done: '#4caf50'
  }
};
