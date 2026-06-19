import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // This will show in your browser console
    console.error("ErrorBoundary caught:", error, info);
    this.setState({ info });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, info: null });
  };

  handleGoHome = () => {
    // Hard navigation guarantees a clean slate even if state is corrupted.
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 24,
            textAlign: "center",
            color: "#f9fafb",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Something went wrong</h1>
          <p style={{ margin: 0, opacity: 0.85, maxWidth: 360 }}>
            This screen hit an unexpected error. You can try again or head back
            to the start.
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button className="btn-primary" onClick={this.handleReset}>
              Try again
            </button>
            <button className="btn" onClick={this.handleGoHome}>
              Go to home
            </button>
          </div>

          <details
            style={{ maxWidth: 420, opacity: 0.7, fontSize: "0.78rem" }}
          >
            <summary style={{ cursor: "pointer" }}>Technical details</summary>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                textAlign: "left",
                marginTop: 8,
              }}
            >
              {String(this.state.error)}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
