import { useAuth } from './AuthProvider';
import { SignInScreenView } from './SignInScreenView';

export function SignInScreen() {
  const auth = useAuth();
  return <SignInScreenView cancelGoogleSignIn={auth.cancelGoogleSignIn} googlePending={auth.googlePending}
    sendMagicLink={auth.sendMagicLink} signInWithGoogle={auth.signInWithGoogle}
    signOutWarning={auth.signOutWarning} status={auth.status} />;
}
