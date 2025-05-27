# TypeCraft - Adaptive Typing Practice

TypeCraft is an innovative web application designed to help users enhance their typing speed and accuracy through adaptively generated text. Whether you're practicing general prose or honing your coding skills in various programming languages, TypeCraft adjusts the difficulty based on your performance, providing a personalized and effective learning experience.

## Built with Next.js

This project is built using Next.js, a powerful React framework for building modern, server-rendered web applications. Next.js offers features like:

*   **App Router:** For flexible and performant routing with support for layouts and server components.
*   **Server Components & Actions:** Reducing client-side JavaScript and simplifying data mutations.
*   **Built-in Optimizations:** Including image optimization, internationalization, and more.
*   **TypeScript Support:** For enhanced code quality and developer experience.

## Getting Started

To explore the application's main features, begin by examining the code in `src/app/page.tsx`, which serves as the entry point for the TypeCraft interface. The core logic for the typing application can be found within `src/components/typecraft/TypeCraftApp.tsx`.

For the AI-powered text generation, refer to the Genkit flows located in the `src/ai/flows/` directory, particularly `adaptive-text-generation.ts`.
