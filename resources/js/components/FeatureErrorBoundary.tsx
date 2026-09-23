import React from 'react';

interface FeatureErrorBoundaryProps {
    children: React.ReactNode;
    featureName: string;
    onReset?: () => void;
}

interface FeatureErrorBoundaryState {
    hasError: boolean;
}

export class FeatureErrorBoundary extends React.Component<
    FeatureErrorBoundaryProps,
    FeatureErrorBoundaryState
> {
    public state: FeatureErrorBoundaryState = { hasError: false };

    public static getDerivedStateFromError(): FeatureErrorBoundaryState {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error(
            `${this.props.featureName} failed to render`,
            error,
            errorInfo,
        );
    }

    private handleReset = (): void => {
        this.setState({ hasError: false });
        this.props.onReset?.();
    };

    public render(): React.ReactNode {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <div
                role="alert"
                className="fixed bottom-5 left-1/2 z-[70] w-[min(92vw,30rem)] -translate-x-1/2 rounded-2xl border border-rose-200 bg-white p-4 shadow-2xl dark:border-rose-900 dark:bg-slate-900"
            >
                <p className="font-semibold text-slate-950 dark:text-white">
                    {this.props.featureName} could not open.
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    The rest of Nexora is still available. Close this message
                    and try again.
                </p>
                <button
                    type="button"
                    onClick={this.handleReset}
                    className="mt-3 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
                >
                    Close
                </button>
            </div>
        );
    }
}
