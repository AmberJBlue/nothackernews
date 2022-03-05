import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.css';
import App from './components/App';
import { setContext } from '@apollo/client/link/context';
import { BrowserRouter } from 'react-router-dom';
import { AUTH_TOKEN } from './constants';
import { split } from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';

// Import all the dependencies we need to wire up the Apollo client
import {
  ApolloProvider,
  ApolloClient,
  createHttpLink,
  InMemoryCache
} from '@apollo/client';

// Connect our ApolloClient instance with the GraphQL API
const httpLink = createHttpLink({
  uri: 'http://localhost:4000'
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem(AUTH_TOKEN);
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ''
    }
  };
});

const wsLink = new WebSocketLink({
  uri: `ws://localhost:4000/graphql`,
  options: {
    reconnect: true,
    connectionParams: {
      authToken: localStorage.getItem(AUTH_TOKEN)
    }
  }
});

const link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return (
      kind === 'OperationDefinition' &&
      operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);


// We instantiate ApolloClient by passing in the httpLink and a new instance of an InMemoryCache.
const client = new ApolloClient({
  link,
  cache: new InMemoryCache()
});
// Render the root component of our React app. The App is wrapped with the higher-order component ApolloProvider that gets passed the client as a prop.
ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root')
);
 
