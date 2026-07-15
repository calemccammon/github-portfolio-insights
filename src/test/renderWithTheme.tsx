import { render, type RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import type { ReactElement } from 'react';

const theme = createTheme({ palette: { mode: 'dark' } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export function renderWithTheme(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: Wrapper, ...options });
}
