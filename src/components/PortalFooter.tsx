import "../styles/PortalFooter.css";

const PortalFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="portal-page-footer">
      <p>{`© ${currentYear} HireLink. All rights reserved.`}</p>
      <small>Smart hiring platform for candidates and recruiters.</small>
    </footer>
  );
};

export default PortalFooter;
