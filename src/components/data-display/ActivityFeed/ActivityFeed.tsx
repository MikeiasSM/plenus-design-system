import type { ComponentPropsWithRef, ReactNode } from 'react';
import styles from './ActivityFeed.module.css';

export type ActivityFeedProps = ComponentPropsWithRef<'ol'>;

export interface ActivityFeedItemProps extends Omit<ComponentPropsWithRef<'li'>, 'children'> {
  /** O acontecimento: quem fez o quê. */
  children: ReactNode;
  /** Comentário citado abaixo do acontecimento. */
  comment?: ReactNode;
  /** Data legível por máquina do momento, em ISO 8601. */
  dateTime?: string;
  /** O momento como o produto o mostra, como "há 12 min". */
  time: ReactNode;
}

function ActivityFeedRoot({ className, ...props }: ActivityFeedProps) {
  return <ol {...props} className={[styles.feed, className].filter(Boolean).join(' ')} />;
}

function ActivityFeedItem({ children, className, comment, dateTime, time, ...props }: ActivityFeedItemProps) {
  const hasComment = comment != null && comment !== false;

  return (
    <li {...props} className={[styles.item, className].filter(Boolean).join(' ')} data-comment={hasComment || undefined}>
      <span aria-hidden="true" className={styles.marker} />
      <div className={styles.content}>
        <div className={styles.event}>{children}</div>
        {dateTime ? (
          <time className={styles.time} dateTime={dateTime}>
            {time}
          </time>
        ) : (
          <span className={styles.time}>{time}</span>
        )}
        {hasComment && <blockquote className={styles.comment}>{comment}</blockquote>}
      </div>
    </li>
  );
}

export const ActivityFeed = Object.assign(ActivityFeedRoot, { Item: ActivityFeedItem });
