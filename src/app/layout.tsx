'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HistoryProvider } from "../contexts/HistoryContext";
import { MonitoringProvider } from "../contexts/MonitoringContext";
import { SettingsProvider } from "../contexts/SettingsContext";
import { ApiProvider } from "../contexts/ApiContext";
import { ThemeProvider, createTheme } from "@mui/material";
import { useEffect, useState } from "react";
import Script from "next/script";
import dynamic from "next/dynamic";

const PWAInstallPrompt = dynamic(() => import('../components/PWAInstallPrompt'), {
  ssr: false
});

const SplashScreen = dynamic(() => import('../components/SplashScreen'), {
  ssr: false
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Create a theme instance with more modern colors and styles
const theme = createTheme({
  palette: {
    primary: {
      main: '#FF3737', // Deepened YouTube red
      light: '#ff6666',
      dark: '#c50000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#333333', // Darkened gray
      light: '#555555',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff', // White background
      paper: '#ffffff',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
    text: {
      primary: '#000000', // Black text for maximum contrast
      secondary: '#333333', // Dark gray for secondary text
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isPWA, setIsPWA] = useState(false);
  
  useEffect(() => {
    // Check if the app is running in standalone mode (PWA)
    if (typeof window !== 'undefined') {
      setIsPWA(window.matchMedia('(display-mode: standalone)').matches);
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#FF3737" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider theme={theme}>
          <SettingsProvider>
            <ApiProvider>
              <HistoryProvider>
                <MonitoringProvider>
                  {isPWA && <SplashScreen />}
                  {children}
                  <PWAInstallPrompt />
                </MonitoringProvider>
              </HistoryProvider>
            </ApiProvider>
          </SettingsProvider>
        </ThemeProvider>
        <Script src="/pwa.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
