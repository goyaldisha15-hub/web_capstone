import { Link } from 'react-router-dom';

export default function PostCard({ post }) {
  return (
    <article className="card">
      <h3><Link to={`/posts/${post._id}`}>{post.title}</Link></h3>
      <p className="meta">
        {post.author?.name && <>by <Link to={`/users/${post.author._id}`}>{post.author.name}</Link> · </>}
        {new Date(post.createdAt).toLocaleDateString()}
        {post.status === 'draft' && <span className="tag draft">draft</span>}
      </p>
      <p>{post.content?.slice(0, 160)}{post.content?.length > 160 && '…'}</p>
      <div>{post.tags?.map((t) => <span key={t} className="tag">#{t}</span>)}</div>
    </article>
  );
}