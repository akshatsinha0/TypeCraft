# TypeCraft - Adaptive Typing Practice

TypeCraft is an innovative web application designed to help users enhance their typing speed and accuracy through adaptively generated text. Whether you're practicing general prose or honing your coding skills in various programming languages, TypeCraft adjusts the difficulty based on your performance, providing a personalized and effective learning experience.

## Overview

This project is built to showcase modern web development practices, focusing on user experience and responsive design. TypeCraft aims to provide a seamless and engaging platform for users to improve their typing abilities.

## Features

*   **Adaptive Text Generation:** AI-powered text that adjusts to the user's skill level.
*   **Multiple Modes:** Practice with general prose or code snippets from various programming languages.
*   **Performance Tracking:** Get feedback on your WPM (Words Per Minute) and accuracy.
*   **Customizable Sessions:** Set time limits and skill levels for tailored practice.
*   **Modern UI:** A clean, intuitive, and responsive interface built with ShadCN UI components and Tailwind CSS.

## Built with Next.js

This project leverages the power of Next.js, a leading React framework for building server-rendered applications and static websites. Next.js enables:

*   **App Router:** For efficient and flexible routing, supporting nested layouts, server components, and more. This paradigm improves performance and developer experience.
*   **Server Components & Server Actions:** These features help reduce the amount of JavaScript sent to the client, leading to faster load times and improved performance. Server Actions simplify data mutations by allowing direct server function calls from components without needing to manually create API endpoints.
*   **TypeScript:** Enhances code quality and maintainability through static typing.
*   **Optimized Performance:** Features like image optimization (`next/image`), code splitting, and prefetching contribute to a fast user experience.
*   **Rich Ecosystem:** Compatibility with a wide range of libraries and tools, including Tailwind CSS for styling and Genkit for AI integrations.

## Getting Started

To explore the application's main features, begin by examining the code in `src/app/page.tsx`, which serves as the entry point for the TypeCraft interface. The core logic for the typing application can be found within `src/components/typecraft/TypeCraftApp.tsx`.

For the AI-powered text generation, refer to the Genkit flows located in the `src/ai/flows/` directory, particularly `adaptive-text-generation.ts`.

To run the project locally:

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Run the development server: `npm run dev`

The application will typically be available at `http://localhost:9002`.

## Project Structure

*   `src/app/`: Contains the main pages and layout of the application using Next.js App Router.
*   `src/components/`: Reusable React components, including UI elements from ShadCN and custom application components.
    *   `src/components/typecraft/`: Core components specific to the TypeCraft application.
    *   `src/components/ui/`: ShadCN UI components.
*   `src/ai/`: Houses the AI logic, primarily Genkit flows for text generation.
    *   `src/ai/flows/`: Specific Genkit flows, like `adaptive-text-generation.ts`.
*   `src/lib/`: Utility functions.
*   `src/hooks/`: Custom React hooks.
*   `public/`: Static assets.
*   `tailwind.config.ts`: Configuration for Tailwind CSS.
*   `next.config.ts`: Configuration for Next.js.

This structure promotes modularity and separation of concerns, making the codebase easier to understand and maintain.
