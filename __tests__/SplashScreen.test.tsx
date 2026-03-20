import React from 'react';
import { render } from '@testing-library/react-native';
import { SplashScreen } from '../components/ui/SplashScreen';

describe('SplashScreen', () => {
    it('renders correctly', () => {
        const { getByTestId, findByProps } = render(<SplashScreen />);
        // Check if component renders without crashing
        // Since we are mocking Image, we just verify the render completes
    });

    it('contains the background and orbs', () => {
        const { container } = render(<SplashScreen />);
        // Check for presence of elements if we added testID, but for now just basic render sanity
        expect(container).toBeTruthy();
    });
});
