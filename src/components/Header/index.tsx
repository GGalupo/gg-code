import Image from 'next/image';
import Link from 'next/link';

import styles from './header.module.scss';

export default function Header() {
  return (
    <header className={styles.headerContainer}>
      <Link href="/">
        <a>
          <Image src="/Logo.svg" alt="logo" width={147} height={25} />
        </a>
      </Link>
    </header>
  );
}
