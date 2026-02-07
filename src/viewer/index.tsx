import React from 'react';
import { createRoot } from 'react-dom/client';
import Viewer from './viewer';
import './viewer.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<Viewer />);
}
