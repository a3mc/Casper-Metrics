import { RequestHandler } from 'express-serve-static-core';

export interface RequiredPermissions {
    required?: string;
}

export interface MyUserProfile {
    id: number;
    email?: string;
    permissions: string;
}

