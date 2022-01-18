import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import styles from './post.module.scss';
import commonStyles from '../../styles/common.module.scss';

interface Content {
  heading: string;
  body: {
    text: string;
  }[];
}

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
      alt: string;
    };
    author: string;
    content: Content[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  return (
    <>
      <Head>
        <title>{post.data.title} | GG Code</title>
      </Head>
      <span>Header</span>

      <main className={commonStyles.container}>
        <Image
          src={post.data.banner.url}
          alt={post.data.banner.alt}
          width={1440}
          height={400}
        />
        <h1>{post.data.title}</h1>
        <time>{post.first_publication_date}</time>
        <span>{post.data.author}</span>

        {post.data.content.map((section, index) => (
          <section key={index}>
            <h2>{section.heading}</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(section.body),
              }}
            />
          </section>
        ))}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post: Post = {
    first_publication_date: response.first_publication_date,
    data: {
      author: response.data.author,
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
        alt: response.data.banner.alt,
      },
      content: response.data.content.map((obj: Content) => ({
        heading: obj.heading,
        body: [...obj.body],
      })),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 12, // 12h
  };
};
