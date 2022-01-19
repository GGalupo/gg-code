import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import Header from '../../components/Header';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

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
  readTime: number;
}

export default function Post({ post, readTime }: PostProps) {
  return (
    <>
      <Head>
        <title>{post.data.title} | GG Code</title>
      </Head>

      <Header />

      <div className={styles.banner}>
        <Image
          src={post.data.banner.url}
          alt={post.data.banner.alt}
          width={1440}
          height={400}
        />
      </div>

      <main className={commonStyles.container}>
        <div className={styles.post}>
          <h1>{post.data.title}</h1>

          <div className={styles.postInfo}>
            <div>
              <Image
                src="/calendar.svg"
                alt="Clock logo"
                width={20}
                height={20}
              />
              <time>{post.first_publication_date}</time>
            </div>
            <div>
              <Image src="/user.svg" alt="Clock logo" width={20} height={20} />
              <span>{post.data.author}</span>
            </div>
            <div>
              <Image src="/clock.svg" alt="Clock logo" width={20} height={20} />
              <span>{readTime} min</span>
            </div>
          </div>

          {post.data.content.map((section, index) => (
            <section className={styles.postSection} key={index}>
              <h2>{section.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(section.body),
                }}
              />
            </section>
          ))}
        </div>
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
    first_publication_date: format(
      new Date(response.first_publication_date),
      'ee MMM yyyy',
      { locale: ptBR }
    ),
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

  const reducer = (acc: number, val: Content) => {
    const headingWords = val.heading.split(' ').length;
    const bodyWords = RichText.asText(val.body).split(' ').length;

    return acc + headingWords + bodyWords;
  };

  const getReadTime = (postContent: Content[]) => {
    const words = postContent.reduce(reducer, 0);
    const wordsPerMinute = 200;

    return Math.ceil(words / wordsPerMinute);
  };

  const readTime = getReadTime(post.data.content);

  return {
    props: {
      post,
      readTime,
    },
    revalidate: 60 * 60 * 12, // 12h
  };
};
