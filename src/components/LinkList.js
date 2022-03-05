import React from "react";
import Link from './Link'
import { useQuery, gql } from "@apollo/client";
import { useLocation, useNavigate } from 'react-router-dom';
import { LINKS_PER_PAGE } from '../constants';


const NEW_VOTES_SUBSCRIPTION = gql`
  subscription {
    newVote {
      id
      link {
        id
        url
        description
        createdAt
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
      user {
        id
      }
    }
  }
`;

export const FEED_QUERY = gql`
  query FeedQuery(
    $take: Int
    $skip: Int
    $orderBy: LinkOrderByInput
  ) {
    feed(take: $take, skip: $skip, orderBy: $orderBy) {
      id
      links {
        id
        createdAt
        url
        description
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
      count
    }
  }
`;

const LinkList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isNewPage = location.pathname.includes(
    'new'
  );

  const pageIndexParams = location.pathname.split(
    '/'
  );

  const page = parseInt(
    pageIndexParams[pageIndexParams.length - 1]
  );

  const pageIndex = page ? (page - 1) * LINKS_PER_PAGE : 0;

  const getQueryVariables = (isNewPage, page) => {
    const skip = isNewPage ? (page - 1) * LINKS_PER_PAGE : 0;
    const take = isNewPage ? LINKS_PER_PAGE : 100;
    const orderBy = { createdAt: 'desc' };
    return { take, skip, orderBy };
  };

   // Calculate list of links to be rendered
   const getLinksToRender = (isNewPage, data) => {
    if (isNewPage) {
      return data.feed.links;
    }
    const rankedLinks = data.feed.links.slice();
    rankedLinks.sort(
      (l1, l2) => l2.votes.length - l1.votes.length
    );
    return rankedLinks;
  };
  
  const {
    data,
    loading,
    error,
    subscribeToMore
  } = useQuery(FEED_QUERY, {
    variables: getQueryVariables(isNewPage, page),
    fetchPolicy: "cache-and-network"  // see note for explanation
  });

  subscribeToMore({
    document: NEW_VOTES_SUBSCRIPTION
  });

  return (
    <>
      {loading && <p>Loading...</p>}
      {error && <pre>{JSON.stringify(error, null, 2)}</pre>}
      {data && (
        <>
          {getLinksToRender(isNewPage, data).map(
            (link, index) => (
              <Link
                key={link.id}
                link={link}
                index={index + pageIndex}
              />
            )
          )}
          {isNewPage && (
            <div className="flex ml4 mv3 gray">
              <div
                className="pointer mr2"
                onClick={() => {
                  if (page > 1) {
                    navigate(`/new/${page - 1}`);
                  }
                }}
              >
                Previous
              </div>
              <div
                className="pointer"
                onClick={() => {
                  if (
                    page <=
                    data.feed.count / LINKS_PER_PAGE
                  ) {
                    const nextPage = page + 1;
                    navigate(`/new/${nextPage}`);
                  }
                }}
              >
                Next
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default LinkList;