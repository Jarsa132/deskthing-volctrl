import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'


import {NextUIProvider} from "@nextui-org/react";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NextUIProvider>
      <App />
    </NextUIProvider>
  </StrictMode>,
)
