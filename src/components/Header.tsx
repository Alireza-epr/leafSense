import headerStyle from "./Header.module.scss";

const Header = () => {
  return (
    <div className={` ${headerStyle.wrapper}`}>
      <div className={` ${headerStyle.headerItem}`}>
        <img src="./src/assets/images/leaf.svg" alt="LeafSense" title="LeafSense" />
      </div>
      <div className={` ${headerStyle.headerItem}`}>
        LeafSense
      </div>
      <div className={` ${headerStyle.headerItem}`}>
        <img src="./src/assets/images/history.svg" alt="History" title="History" />
      </div>
    </div>
  );
};

export default Header;
