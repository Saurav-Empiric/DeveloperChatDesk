export type UserRole = 'admin' | 'developer';

declare global {

    interface User {
        id: string;
        name: string;
        email: string;
        role: 'admin' | 'developer';
        createdAt: Date;
        updatedAt: Date;
    }

    interface UserRegistrationData {
        name: string;
        email: string;
        password: string;
    }

    interface AuthResponse {
        success: boolean;
        error?: string;
        canRegister?: boolean;
    }

    interface UserLoginData {
        email: string;
        password: string;
    }

    interface PasswordResetData {
        token: string;
        email: string;
        password: string;
      } 
}

export { }