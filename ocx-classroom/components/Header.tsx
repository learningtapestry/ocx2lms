import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/client";
import styles from "styles/App.module.css";

const Header = ({ title }) => {
  const [session, _loading] = useSession();

  const onSignIn = () => signIn("google");

  const onSignOut = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    signOut().then(() => location.reload());
  };

  return (
    <header>
      <div className={styles.nav}>
        <div className={styles.navTitle}>
          <Link href="/">{title}</Link>
        </div>
        <ul>
          {session ? (
            <>
              <span className={styles.navUser}>Welcome, {session.user?.name}</span>
              <li className={styles.navItem}>
                <a onClick={onSignOut}>Sign Out</a>
              </li>
            </>
          ) : (
            <li className={styles.navItem}>
              <a onClick={onSignIn}>Sign In</a>
            </li>
          )}
        </ul>
      </div>
    </header>
  );
};

export default Header;
