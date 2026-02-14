import "../styles/PermissionToast.css";

export default function PermissionToast({ message }) {
  if (!message) return null;

  return (
    <div className="permission-toast">
      <div className="permission-toast-icon">🔒</div>
      <div className="permission-toast-text">
        <strong>Read-only mode</strong>
        <div>{message}</div>
      </div>
    </div>
  );
}
