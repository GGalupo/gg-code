import { useState } from 'react';

import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string | null;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);

  async function handleFetchMorePosts() {
    if (postsPagination.next_page) {
      try {
        const fetchResponse: PostPagination = await fetch(
          postsPagination.next_page
        ).then(res => res.json());

        const newPosts = fetchResponse.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'ee MMM yyyy',
              { locale: ptBR }
            ),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        setPosts([...posts, ...newPosts]);
        setNextPage(fetchResponse.next_page);
      } catch (e) {
        console.error(e);
      }
    }
  }

  return (
    <>
      <Head>
        <title>Home | GG Code</title>
      </Head>

      <main className={commonStyles.container}>
        <Image src="/Logo.svg" alt="logo" width={147} height={25} />

        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <h2>{post.data.title}</h2>
                <p>{post.data.subtitle}</p>

                <div className={styles.infoContainer}>
                  <div>
                    <img src="/calendar.svg" />
                    <time>{post.first_publication_date}</time>
                  </div>

                  <div>
                    <img src="/user.svg" />
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>

        {nextPage && (
          <button
            className={styles.button}
            type="button"
            onClick={handleFetchMorePosts}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'ee MMM yyyy',
        { locale: ptBR }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination: PostPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
    },
    revalidate: 60 * 60 * 12, // 12h
  };
};
