import React from 'react';
import { Subscribe } from '@react-rxjs/core'
import { ErrorBoundary } from 'react-error-boundary'
import logo from './logo.svg';
import './App.css';

function ParagraphComponent(useText: () => any) {
  const text = useText();
  return (
    <p>
      {text}
    </p>
  );
}

function App({ useUserId } : { useUserId: () => any }): any {
  const UserIdComponent = ParagraphComponent.bind(null, useUserId);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        foo
        <Subscribe fallback={<p>Loading</p>}>
          <ErrorBoundary fallback={<p>It's a wipe</p>}>
            <UserIdComponent />
          </ErrorBoundary>
        </Subscribe>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
