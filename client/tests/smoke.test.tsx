import React from 'react';
import { describe, test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from '../src/renderer/pages/Login';
import Register from '../src/renderer/pages/Register';

describe('client smoke test', () => {
  test('renders Login by default route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );
  const heading = screen.getByRole('heading', { name: 'Login' });
  const helper = screen.getByText('No account?');
  expect(heading).toBeTruthy();
  expect(helper).toBeTruthy();
  });

  test('renders Register route', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

  const title = screen.getByText('Create Account');
  const btn = screen.getByRole('button', { name: 'Create' });
  expect(title).toBeTruthy();
  expect(btn).toBeTruthy();
  });
});
