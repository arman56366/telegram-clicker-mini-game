import React from 'react';
import styles from './PayLine.module.scss';

const PayLine = () => {
  return (
    <div className={styles.payLine}>
      <div className={styles.line} />
      <div className={styles.label}>PAY LINE</div>
    </div>
  );
};

export default PayLine;
