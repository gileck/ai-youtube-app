// import { NextRequest } from 'next/server';

// // Augment the Next.js types to fix the type errors
// declare module 'next/dist/server/app-render/entry-base' {
//   export interface PageProps {
//     params?: Record<string, string>;
//     searchParams?: Record<string, string | string[]>;
//   }
// }

// // Define proper route handler parameter types
// declare module 'next/dist/server/future/route-modules/route-module' {
//   export interface RouteHandler {
//     POST(request: NextRequest, context: { params: Record<string, string> }): Promise<Response>;
//   }
// }
