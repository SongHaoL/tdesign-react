import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useConfig from '../_util/useConfig';
import { StyledProps } from '../_type';
import { TdTimePickerProps } from '../_type/components/time-picker';
import Popup from '../popup/Popup';
import noop from '../_util/noop';
import { Icon } from '../icon';

export interface TimePickerProps extends TdTimePickerProps, StyledProps {}

const blockName = 'time-picker';

const TimePicker: React.FC<TimePickerProps> = (props: TimePickerProps) => {
  const {
    value = '',
    defaultValue = '',
    clearable = true, // 默认展示清空按钮
    allowInput = false,
    disabled = false,
    disableTime = noop,
    placeholder = '',
    // format = 'hh:mm:ss', // 使用props.value获取
    // size = 'medium', // todo size
    steps = [1, 1, 1],
    onChange = noop,
    onOpen = noop,
    onClose = noop,
    onInput = noop,
    // onBlur = noop, // todo Popup组件不支持
    // onFocus = noop, // todo Popup组件不支持
    className = '',
    style = {},
    // multiple = false, // todo 多选
    hideDisabledTime = true,
  } = props;
  // TimePickerProps={
  //   allowInput: false,
  //   className: "",
  //   clearable: false,
  //   defaultValue: undefined,
  //   disableTime(h: number, m: number, s: number): boolean {
  //     return false;
  //   },
  //   disabled: false,
  //   format: "",
  //   hideDisabledTime: false,
  //   multiple: false,
  //   onBlur(context: { input: string; value: TimePickerValue; e: React.FocusEvent<HTMLDivElement> }): void {
  //   },
  //   onChange(value: TimePickerValue): void {
  //   },
  //   onClose(context: { e: React.MouseEvent<HTMLDivElement> }): void {
  //   },
  //   onFocus(context: { input: string; value: TimePickerValue; e: React.FocusEvent<HTMLDivElement> }): void {
  //   },
  //   onInput(context: { input: string; value: TimePickerValue; e: React.FormEvent<HTMLDivElement> }): void {
  //   },
  //   onOpen(context: { e: React.MouseEvent<HTMLDivElement> }): void {
  //   },
  //   placeholder: "",
  //   size: undefined,
  //   steps: undefined,
  //   style: undefined,
  //   value: undefined
  // }

  const { classPrefix } = useConfig();
  // 是否使用12小时制
  // 读取显示格式 如果没有指定就解析value的格式 没有就默认hh:mm:ss
  const [format] = useState(() => {
    if (props.format) return props.format;
    const { value } = props;
    if (value) {
      // 如果没有填format 那么通过value生成format
      if (value instanceof Date) {
        return 'hh:mm:ss';
      }
      if (typeof value === 'string') {
        let tempValue = value; // 22:33:44
        let tempFormat = '';
        const fetchCharIsNumber = (n) => {
          const i = tempValue.slice(0, n);
          if (/^\d+$/.test(i)) {
            tempValue = tempValue.slice(n);
            return true;
          }
          return false;
        };
        const fetchChar = () => {
          const i = tempValue.slice(0, 1); // 取一个字符
          tempValue = tempValue.slice(1);
          return i;
        };
        const c = 'hms';
        let t = 0;
        while (true) {
          if (tempValue === '') break;
          if (t < 3) {
            if (fetchCharIsNumber(2)) {
              tempFormat += c[t] + c[t];
              t = t + 1;
            } else if (fetchCharIsNumber(1)) {
              tempFormat += c[t];
              t = t + 1;
            } else {
              const c = fetchChar();
              tempFormat += c;
            }
          } else {
            const v = tempValue.slice(0, 2);
            if (v === 'am' || v === 'pm') {
              tempFormat += 'a';
            } else if (v === 'AM' || v === 'PM') {
              tempFormat += 'A';
            } else {
              const c = fetchChar();
              tempFormat += c;
            }
          }
        }
        return tempFormat;
      }
    }
    return 'hh:mm:ss';
  });
  // 是否是12小时制显示 true为12小时 false为24小时制
  const h12format = useMemo(() => format.includes('a') || format.includes('A'), [format]);
  const getNewTime = useCallback(() => {
    const newTime = new Date();
    newTime.setHours(0);
    newTime.setMinutes(0);
    newTime.setSeconds(0);
    newTime.setMilliseconds(0);
    return newTime;
  }, []);
  const getTimeFromValue = useCallback(
    (value) => {
      let tempFormat = format;
      const date = getNewTime();
      if (value instanceof Date) {
        date.setTime(value.getTime());
        return date;
      }
      if (typeof value === 'string') {
        let isAMPM = false; // 是否确定上午还是下午
        let tempValue = value;
        while (true) {
          if (tempFormat.startsWith('hh') || tempFormat.startsWith('HH')) {
            date.setHours(Number(tempValue.slice(0, 2)));
            tempFormat = tempFormat.slice(2);
            tempValue = tempValue.slice(2);
          } else if (tempFormat.startsWith('mm') || tempFormat.startsWith('MM')) {
            date.setMinutes(Number(tempValue.slice(0, 2)));
            tempFormat = tempFormat.slice(2);
            tempValue = tempValue.slice(2);
          } else if (tempFormat.startsWith('ss') || tempFormat.startsWith('SS')) {
            date.setSeconds(Number(tempValue.slice(0, 2)));
            tempFormat = tempFormat.slice(2);
            tempValue = tempValue.slice(2);
          } else if (tempFormat.startsWith('a') || tempFormat.startsWith('A')) {
            if (isAMPM) continue;
            isAMPM = true;
            if (tempValue.startsWith('am') || tempValue.startsWith('AM')) {
            } else if (tempValue.startsWith('pm') || tempValue.startsWith('PM')) {
              date.setHours(date.getHours() + 12);
            } else {
            }
            tempFormat = tempFormat.slice(1);
            tempValue = tempValue.slice(2);
          } else {
            tempFormat = tempFormat.slice(1);
            tempValue = tempValue.slice(1);
          }
          if (tempFormat === '') break;
        }
      }
      return date;
    },
    [format, getNewTime],
  );
  const [time, setTime] = useState<Date>(() => getTimeFromValue(value ?? defaultValue));
  const prefixCls = React.useCallback(
    (...args: (string | [string, string?, string?])[]) => {
      let className = '';
      args.forEach((item, index) => {
        if (item && index > 0) className = className.concat(' ');
        if (item instanceof Array) {
          const [block, element, modifier] = item;
          className = className.concat(classPrefix, '-', block);
          if (element) className = className.concat('__', element);
          if (modifier) className = className.concat('--', modifier);
        } else if (typeof item === 'string') {
          className = className.concat(classPrefix, '-', item);
        }
      });
      return className;
    },
    [classPrefix],
  );
  const format00 = useCallback((n: number) => (n < 10 ? `0${n}` : `${n}`), []);
  const input = useCallback(
    (n: 0 | 1 | 2 | 3, e) => {
      if (!allowInput) return;
      onInput({ input: `${n}`, value: time, e });
      const { keyCode } = e;
      // console.log(keyCode);
      e.preventDefault(); // 防止方向键控制的时候移动页面
      if (keyCode === 37) {
        // left key
        const elem = e.currentTarget.previousElementSibling;
        if (elem) elem.getElementsByTagName('input')[0]?.focus();
        return;
      }
      if (keyCode === 39) {
        // right key
        const elem = e.currentTarget.nextElementSibling;
        if (elem) elem.getElementsByTagName('input')[0]?.focus();
        return;
      }
      if (keyCode === 9) {
        // tab key
        const elem = e.currentTarget.nextElementSibling;
        if (elem) elem.getElementsByTagName('input')[0]?.focus();
        else {
          // back first elem
          const [elem] = e.currentTarget.parentNode.children;
          if (elem) elem.getElementsByTagName('input')[0]?.focus();
        }
        return;
      }
      if (n === 3) {
        // am pm 单独处理
        if (keyCode === 65 || keyCode === 38 || keyCode === 8 || keyCode === 46) {
          // a key up key backspace key delete key
          if (time.getHours() >= 12) {
            time.setHours(time.getHours() - 12);
            setTime(new Date(time.valueOf()));
          }
        } else if (keyCode === 80 || keyCode === 40) {
          // p key down key
          if (time.getHours() < 12) {
            time.setHours(time.getHours() + 12);
            setTime(new Date(time.valueOf()));
          }
        }
        return;
      }
      let result: number = null;
      let number: number = null;
      if (n === 0) {
        result = time.getHours();
      } else if (n === 1) {
        result = time.getMinutes();
      } else if (n === 2) {
        result = time.getSeconds();
      }
      if (keyCode === 8 || keyCode === 46) {
        // backspace key delete key
        result = 0;
      } else if (keyCode >= 48 && keyCode <= 57) {
        // 输入数值 拼接到后面
        number = keyCode - 48;
        result = Number(`${result}${number}`);
      } else if (keyCode === 38) {
        // up key
        result = result - 1;
      } else if (keyCode === 40) {
        // down key
        result = result + 1;
      } else return;

      if (n === 0) {
        if (result < 24 && result >= 0) {
          time.setHours(result);
          setTime(new Date(time.valueOf()));
        } else {
          if (number !== null) {
            time.setHours(number);
            setTime(new Date(time.valueOf()));
          }
        }
      } else if (n === 1) {
        if (result < 60 && result >= 0) {
          time.setMinutes(result);
          setTime(new Date(time.valueOf()));
        } else {
          if (number !== null) {
            time.setMinutes(number);
            setTime(new Date(time.valueOf()));
          }
        }
      } else if (n === 2) {
        if (result < 60 && result >= 0) {
          time.setSeconds(result);
          setTime(new Date(time.valueOf()));
        } else {
          if (number !== null) {
            time.setSeconds(number);
            setTime(new Date(time.valueOf()));
          }
        }
      }
    },
    [allowInput, onInput, time],
  );
  const displayTime = useMemo(() => {
    const result = [];
    let tempFormat = format;
    let i = 0;
    while (true) {
      i = i + 1;
      if (tempFormat.startsWith('hh') || tempFormat.startsWith('HH')) {
        let hour = time.getHours();
        if (h12format) {
          if (hour >= 12) hour -= 12;
        }
        result.push(
          <span
            key={`timeItem${i}_${format}`}
            className={prefixCls([blockName, 'input-item'])}
            onKeyDown={(e) => input(0, e)}
          >
            <input
              className={prefixCls([blockName, 'input-item-input'])}
              value={format00(hour)}
              onChange={noop}
              disabled={disabled}
            />
          </span>,
        );
        tempFormat = tempFormat.slice(2);
      } else if (tempFormat.startsWith('mm') || tempFormat.startsWith('MM')) {
        result.push(
          <span
            key={`timeItem${i}_${format}`}
            className={prefixCls([blockName, 'input-item'])}
            onKeyDown={(e) => input(1, e)}
          >
            <input
              className={prefixCls([blockName, 'input-item-input'])}
              value={format00(time.getMinutes())}
              disabled={disabled}
              readOnly
            />
          </span>,
        );
        tempFormat = tempFormat.slice(2);
      } else if (tempFormat.startsWith('ss') || tempFormat.startsWith('SS')) {
        result.push(
          <span
            key={`timeItem${i}_${format}`}
            className={prefixCls([blockName, 'input-item'])}
            onKeyDown={(e) => input(2, e)}
          >
            <input
              className={prefixCls([blockName, 'input-item-input'])}
              value={format00(time.getSeconds())}
              disabled={disabled}
              readOnly
            />
          </span>,
        );
        tempFormat = tempFormat.slice(2);
      } else if (tempFormat.startsWith('A') || tempFormat.startsWith('a')) {
        let meridiem = time.getHours() >= 12 ? 'pm' : 'am';
        if (tempFormat.startsWith('A')) meridiem = meridiem.toUpperCase(); // 大写显示
        result.push(
          <span
            key={`timeItem${i}_${format}`}
            className={prefixCls([blockName, 'input-item'])}
            onKeyDown={(e) => input(3, e)}
          >
            <input className={prefixCls([blockName, 'input-item-input'])} value={meridiem} readOnly />
          </span>,
        );
        tempFormat = tempFormat.slice(1);
      } else {
        result.push(tempFormat.slice(0, 1));
        tempFormat = tempFormat.slice(1);
      }
      if (tempFormat === '') break;
    }
    return result;
  }, [format, time, h12format, prefixCls, input, format00, disabled]);

  const generateCol = useCallback(
    (begin, end, step, cur, type, click) => {
      let h = time.getHours();
      let m = time.getMinutes();
      let s = time.getSeconds();
      const lis = [];
      for (let i = begin; i <= end; i += step) {
        if (type === 0) h = i;
        else if (type === 1) m = i;
        else if (type === 2) s = i;
        if (disableTime(h, m, s)) {
          if (!hideDisabledTime) {
            lis.push(
              <li
                className={`${classPrefix}-time-picker-panel__body-scroll-item ${
                  i === cur ? `${classPrefix}-is-current` : ''
                } ${classPrefix}-is-disabled`}
                key={i}
              >
                {i < 10 ? `0${i}` : i}
              </li>,
            );
          }
        } else {
          lis.push(
            <li
              className={`${classPrefix}-time-picker-panel__body-scroll-item ${
                i === cur ? `${classPrefix}-is-current` : ''
              }`}
              key={i}
              onClick={disableTime(h, m, s) ? noop : () => click(i)}
            >
              {i < 10 ? `0${i}` : i}
            </li>,
          );
        }
      }
      return lis;
    },
    [classPrefix, disableTime, hideDisabledTime, time],
  );
  const panel = useMemo(() => {
    const result = [];
    if (format.includes('h') || format.includes('H')) {
      let col;
      if (h12format) {
        if (time.getHours() >= 12) {
          col = generateCol(12, 23, steps[0], time.getHours(), 0, (n) => {
            if (disabled) return;
            if (disableTime(n, time.getMinutes(), time.getSeconds())) return;
            time.setHours(n);
            setTime(new Date(time.valueOf()));
          });
        } else {
          col = generateCol(0, 11, steps[0], time.getHours(), 0, (n) => {
            if (disabled) return;
            if (disableTime(n, time.getMinutes(), time.getSeconds())) return;
            time.setHours(n);
            setTime(new Date(time.valueOf()));
          });
        }
      } else {
        col = generateCol(0, 23, steps[0], time.getHours(), 0, (n) => {
          if (disabled) return;
          if (disableTime(n, time.getMinutes(), time.getSeconds())) return;

          time.setHours(n);
          setTime(new Date(time.valueOf()));
        });
      }
      result.push(
        <ul className={`${classPrefix}-time-picker-panel__body-scroll`} key={'h'}>
          {col}
        </ul>,
      );
    }
    if (format.includes('m') || format.includes('M')) {
      const col = generateCol(0, 59, steps[1], time.getMinutes(), 1, (n) => {
        if (disabled) return;
        if (disableTime(time.getHours(), n, time.getSeconds())) return;

        time.setMinutes(n);
        setTime(new Date(time.valueOf()));
      });
      result.push(
        <ul className={`${classPrefix}-time-picker-panel__body-scroll`} key={'m'}>
          {col}
        </ul>,
      );
    }
    if (format.includes('s') || format.includes('S')) {
      const col = generateCol(0, 59, steps[2], time.getSeconds(), 2, (n) => {
        if (disabled) return;
        if (disableTime(time.getHours(), time.getMinutes(), n)) return;

        time.setSeconds(n);
        setTime(new Date(time.valueOf()));
      });
      result.push(
        <ul className={`${classPrefix}-time-picker-panel__body-scroll`} key={'s'}>
          {col}
        </ul>,
      );
    }
    if (format.includes('a') || format.includes('A')) {
      const col = (
        <>
          <li
            className={`${classPrefix}-time-picker-panel__body-scroll-item${
              time.getHours() < 12 ? ` ${classPrefix}-is-current` : ''
            }`}
            onClick={() => {
              if (disabled) return;
              if (time.getHours() >= 12) {
                time.setHours(time.getHours() - 12);
                setTime(new Date(time.valueOf()));
              }
            }}
          >
            {format.includes('a') ? 'am' : 'AM'}
          </li>
          <li
            className={`${classPrefix}-time-picker-panel__body-scroll-item${
              time.getHours() >= 12 ? ` ${classPrefix}-is-current` : ''
            }`}
            onClick={() => {
              if (disabled) return;
              if (time.getHours() < 12) {
                time.setHours(time.getHours() + 12);
                setTime(new Date(time.valueOf()));
              }
            }}
          >
            {format.includes('a') ? 'pm' : 'PM'}
          </li>
        </>
      );
      result.push(
        <ul className={`${classPrefix}-time-picker-panel__body-scroll`} key={'a'}>
          {col}
        </ul>,
      );
    }
    return result;
  }, [classPrefix, disableTime, disabled, format, generateCol, h12format, steps, time]);
  const panelRef = useRef<HTMLElement>();
  const autoScroll = useCallback(() => {
    if (disabled) return;
    if (!panelRef || !panelRef.current) return;
    const parent = panelRef.current.children;
    for (let i = 0; i < parent.length; i++) {
      const item = parent.item(i);
      const current = item.getElementsByClassName(`${classPrefix}-is-current`).item(0);
      if (!current) continue; // 没找到就跳过
      let value = (current as any).offsetTop;
      value -= (item.clientHeight - current.clientHeight) / 2;
      item.scrollTo({
        top: value,
        behavior: 'smooth',
      });
    }
  }, [classPrefix, disabled]);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!visible) return;
    autoScroll();
  }, [autoScroll, time, visible]);

  // useEffect(() => {
  //   const newTime = getTimeFromValue(props.value);
  //
  //   console.log(newTime.getTime(), time.getTime());
  //   setTime(newTime);
  // }, [getTimeFromValue, props.value, time]);
  // useEffect(() => {
  //   if (typeof props.value === 'string') {
  //     const newTime = getTimeFromValue(props.value);
  //     if (newTime.getTime() === time.getTime()) return; // 说明没变 不需要进行更新
  //     setTime(newTime);
  //   } else if (props.value instanceof Date) {
  //     setTime(props.value);
  //   }
  // }, [getTimeFromValue, props.value, time]);
  useEffect(() => {
    if (disabled) return;
    onChange(time);
  }, [disabled, onChange, time]);
  const timeIsEmpty = useCallback((time) => {
    if (!time) return true;
    return time.getHours() === 0 && time.getMinutes() === 0 && time.getSeconds() === 0;
  }, []);
  return (
    <Popup
      disabled={disabled} // todo Popup的disabled属性不起作用
      trigger="click"
      content={
        <div className={`${classPrefix}-time-picker`}>
          <div className={`${classPrefix}-time-picker-panel__body`} ref={(ref) => (panelRef.current = ref)}>
            {panel}
          </div>
        </div>
      }
      placement="bottom"
      onVisibleChange={(visible) => {
        setVisible(visible);
        if (visible) {
          setTimeout(() => autoScroll());
          onOpen({ e: null }); // todo 传入点击事件
        } else {
          onClose({ e: null }); // todo 传入点击事件
        }
      }}
    >
      <div className={`${classPrefix}-time-picker ${className}`} style={style}>
        <div className={prefixCls([blockName, 'group'])}>
          <span className={prefixCls([blockName, 'input'])}>{displayTime}</span>
          <div
            style={{ display: clearable && !timeIsEmpty(time) ? 'block' : 'none' }}
            onClick={() => {
              if (disabled) return;
              setTime(getNewTime());
            }}
          >
            <Icon name="close" style={{ cursor: 'pointer' }} />
          </div>
          <div style={{ display: timeIsEmpty(time) ? 'block' : 'none', color: '#dddddd' }}>{placeholder}</div>
        </div>
      </div>
    </Popup>
  );
};

export default TimePicker;
