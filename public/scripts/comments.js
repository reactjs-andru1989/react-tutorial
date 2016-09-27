const AuthorComments = React.createClass({
  render() {
    const comments = this.props.data.map((comment) => {
      return (
        <Comment key={comment.id}>
          {comment.text}
        </Comment>
      );
    });

    return (
      <div className="AuthorComments">
        {comments}
      </div>
    );
  }
});

const CommentList = React.createClass({
  render() {
    const grouped = this.props.grouped;
    const commentNodes = this.props.keys.map((author) => {
      return (
        [<h2 className="author">{author}</h2>,
        <AuthorComments data={grouped[author]} />]
      )
    });
    return (
      <div className="commentList">
        {commentNodes}
      </div>
    );
  }
});

const Comment = React.createClass({
  rawMarkup() {
    const md = new Remarkable();
    const rawMarkup = md.render(this.props.children.toString());
    return { __html: rawMarkup };
  },

  render() {
    return (
      <div className="comment">
        <span dangerouslySetInnerHTML={this.rawMarkup()} />
      </div>
    );
  }
});

const CommentForm = React.createClass({
  getInitialState() {
    return {author: '', text: ''};
  },
  handleAuthorChange(e) {
    this.setState({author: e.target.value});
  },
  handleTextChange(e) {
    this.setState({text: e.target.value});
  },
  handleSubmit(e) {
    e.preventDefault();
    const author = this.state.author.trim();
    const text = this.state.text.trim();
    if(!text || !author) {
      return;
    }
    this.props.onCommentSubmit({author, text});
    this.setState({author: '', text: ''});
  },
  render() {
    return (
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <input type="text" placeholder="Your name" value={this.state.author} onChange={this.handleAuthorChange} />
        <input type="text" placeholder="Say something..." value={this.state.text} onChange={this.handleTextChange} />
        <input type="submit" value="Post" />
      </form>
    );
  }
});

const CommentBox = React.createClass({
  loadCommentsFromServer() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: data => {
        this.setState({data});
      },
      error: (xhr, status, err) => {
        console.error(this.props.url, status, err.toString());
      }
    });
  },
  handleCommentSubmit(comment) {
    const comments = this.state.data;
    comment.id = Date.now();
    const newComments = comments.concat([comment]);
    this.setState({data: newComments});

    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: comment,
      success: data => {
        this.setState({data});
      },
      error: (xhr, status, err) => {
        this.setState({data: comments});
        console.error(this.props.url, status, err.toString());
      }
    });
  },
  getInitialState() {
    return {data: []};
  },
  componentDidMount() {
    this.loadCommentsFromServer();
    setInterval(this.loadCommentsFromServer, this.props.pollInterval);
  },
  group(object, prop) {
    return object.reduce(function(grouped, item) {
      var key = item[prop];
      grouped[key] = grouped[key] || [];
      grouped[key].push(item);
      return grouped;
    }, {});
  },
  render() {
    const grouped = this.group(this.state.data, 'author');
    const keys = Object.keys(grouped);
    return (
      <div className="commentBox">
        <h1>Comments</h1>
        <CommentList data={this.state.data} keys={keys} grouped={grouped} />
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
    );
  }
});

ReactDOM.render(
  <CommentBox url="/api/comments" pollInterval={2000} />,
  document.getElementById('content')
)