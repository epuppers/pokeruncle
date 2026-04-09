import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { router } from './router'
import './index.css'

// GitHub Pages SPA redirect: pick up saved path from 404.html
const redirect = sessionStorage.getItem('gh-pages-redirect')
if (redirect) {
  sessionStorage.removeItem('gh-pages-redirect')
  history.replaceState(null, '', redirect)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>
  </StrictMode>,
)
