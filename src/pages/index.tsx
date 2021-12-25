import { useState } from 'react';

import { GetStaticProps } from 'next';
import Image from 'next/image';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

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
  postsResponse: PostPagination;
}

export default function Home({ postsResponse }: HomeProps) {
  const [nextPage, setNextPage] = useState<string | null>(
    postsResponse.next_page
  );
  const [posts, setPosts] = useState<Post[]>(postsResponse.results);

  async function handleFetchMorePosts() {
    if (postsResponse.next_page) {
      const newPosts: PostPagination = await fetch(
        postsResponse.next_page
      ).then(res => res.json());

      setPosts([...posts, ...newPosts.results]);
      setNextPage(newPosts.next_page);
    }
  }

  return (
    <>
      <img src="/Logo.svg" alt="logo" />
      {/* <Image width={238} height={25} src="/Logo.svg" alt="logo" /> */}
      <div>
        {posts.map(post => (
          <div key={post.uid}>
            <p>{post.data.title}</p>
            <p>{post.data.author}</p>
          </div>
        ))}
      </div>
      {nextPage && (
        <button type="button" onClick={handleFetchMorePosts}>
          Carregar mais
        </button>
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsPagination = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 1,
    }
  );

  const posts = postsPagination.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsResponse: PostPagination = {
    next_page: postsPagination.next_page,
    results: posts,
  };

  return {
    props: {
      postsResponse,
    },
    revalidate: 60 * 60 * 12, // 12h
  };
};
