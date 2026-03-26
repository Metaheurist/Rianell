import '@testing-library/jest-native/extend-expect';

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Mock = React.forwardRef((props: any, ref: any) => React.createElement(View, { ...props, ref }, props.children));
  return {
    __esModule: true,
    default: Mock,
    Svg: Mock,
    Circle: Mock,
    Rect: Mock,
    Path: Mock,
    G: Mock,
  };
});

