import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Smoke test: App renders Login by default (no user in localStorage)
test('renders Sign In on the login page', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});
