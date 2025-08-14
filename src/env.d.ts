/// <reference types="astro/client" />

/**
 * Type definitions for the Lucid Framework
 * Extends Astro's built-in types with our authentication middleware additions
 */

import type { AuthSession } from './lib/auth-simple.js';

declare global {
    namespace App {
        interface Locals {
            /**
             * Current authenticated user session (null if not authenticated)
             * Added by auth middleware on every request
             */
            user: AuthSession | null;
            
            /**
             * Quick boolean check for authentication status
             * Added by auth middleware on every request
             */
            isAuthenticated: boolean;
        }
    }
}

/**
 * Environment variables available in Webflow Cloud via locals.runtime.env
 */
interface RuntimeEnv {
    WEBFLOW_CLIENT_ID?: string;
    WEBFLOW_CLIENT_SECRET?: string;
    WEBFLOW_SITE_URL?: string;
    CF_PAGES_URL?: string;
    NODE_ENV?: string;
}