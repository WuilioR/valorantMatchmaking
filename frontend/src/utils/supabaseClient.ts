// Mock Supabase client for development
// This will be replaced with actual backend authentication

export const supabase = {
  auth: {
    signIn: async ({ email, password }: { email: string; password: string }) => {
      // Mock authentication - replace with actual backend call
      console.log('Mock auth signIn:', { email, password });
      return {
        user: { id: 'mock-user-id', email },
        error: null
      };
    },
    signUp: async ({ email, password }: { email: string; password: string }) => {
      // Mock authentication - replace with actual backend call
      console.log('Mock auth signUp:', { email, password });
      return {
        user: { id: 'mock-user-id', email },
        error: null
      };
    },
    signOut: async () => {
      // Mock sign out
      console.log('Mock auth signOut');
      return { error: null };
    },
    getUser: async () => {
      // Mock get current user
      return {
        user: null,
        error: null
      };
    }
  }
};