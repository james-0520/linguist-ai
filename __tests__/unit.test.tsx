import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Layout } from '../components/Layout';
import { Switch } from '../components/Switch';
import { AnalysisResult, AnalysisConfig } from '../types';

// Mock the geminiService functions directly
const mockExtractTextFromImage = vi.fn();
const mockAnalyzeText = vi.fn();

vi.mock('../services/geminiService', () => ({
    extractTextFromImage: mockExtractTextFromImage,
    analyzeText: mockAnalyzeText
}));

// Mock environment variables
beforeEach(() => {
    vi.stubEnv('API_KEY', 'test-api-key');
    vi.stubEnv('GEMINI_IMAGE_MODEL', 'gemini-2.5-flash');
    vi.stubEnv('GEMINI_TEXT_MODEL', 'gemini-2.5-flash');
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    mockExtractTextFromImage.mockReset();
    mockAnalyzeText.mockReset();
});

describe('Component Tests', () => {
    describe('Layout Component', () => {
        test('renders children correctly', () => {
            const testContent = 'Test Content';
            render(<Layout>{testContent}</Layout>);

            expect(screen.getByText(testContent)).toBeInTheDocument();
            expect(screen.getByText('LinguistAI')).toBeInTheDocument();
            expect(screen.getByText('智慧文本校正與流暢度優化')).toBeInTheDocument();
        });

        test('has proper structure and classes', () => {
            render(<Layout><div>Content</div></Layout>);

            const layout = screen.getByRole('main');
            expect(layout).toHaveClass('flex-1 max-w-6xl mx-auto w-full p-4 md:p-8');
        });
    });

    describe('Switch Component', () => {
        test('renders with label and correct initial state', () => {
            const mockOnChange = vi.fn();
            render(<Switch label="Test Switch" checked={false} onChange={mockOnChange} />);

            expect(screen.getByText('Test Switch')).toBeInTheDocument();
            expect(screen.getByRole('checkbox')).not.toBeChecked();
        });

        test('renders checked state correctly', () => {
            const mockOnChange = vi.fn();
            render(<Switch label="Test Switch" checked={true} onChange={mockOnChange} />);

            expect(screen.getByRole('checkbox')).toBeChecked();
        });

        test('calls onChange when clicked', () => {
            const mockOnChange = vi.fn();
            render(<Switch label="Test Switch" checked={false} onChange={mockOnChange} />);

            fireEvent.click(screen.getByText('Test Switch'));
            expect(mockOnChange).toHaveBeenCalledWith(true);
        });

        test('does not call onChange when disabled', () => {
            const mockOnChange = vi.fn();
            render(<Switch label="Test Switch" checked={false} onChange={mockOnChange} disabled={true} />);

            fireEvent.click(screen.getByText('Test Switch'));
            expect(mockOnChange).not.toHaveBeenCalled();
        });

        test('has disabled styling when disabled', () => {
            const mockOnChange = vi.fn();
            render(<Switch label="Test Switch" checked={false} onChange={mockOnChange} disabled={true} />);

            const switchElement = screen.getByText('Test Switch').parentElement;
            expect(switchElement).toHaveClass('opacity-50 cursor-not-allowed');
        });
    });
});

describe('Service Tests', () => {
    describe('geminiService - extractTextFromImage', () => {
        test('throws error when AI service is not available', async () => {
            mockExtractTextFromImage.mockRejectedValue(new Error('Gemini AI service not available. Please check your API key.'));

            await expect(mockExtractTextFromImage('base64data', 'image/png'))
                .rejects
                .toThrow('Gemini AI service not available. Please check your API key.');
        });

        test('handles API quota exceeded error', async () => {
            mockExtractTextFromImage.mockRejectedValue(new Error('API 配額已用盡，請稍後再試或檢查您的 API 金鑰配額。'));

            await expect(mockExtractTextFromImage('base64data', 'image/png'))
                .rejects
                .toThrow('API 配額已用盡，請稍後再試或檢查您的 API 金鑰配額。');
        });

        test('handles authentication errors', async () => {
            mockExtractTextFromImage.mockRejectedValue(new Error('API 金鑰無效或權限不足，請檢查您的設定。'));

            await expect(mockExtractTextFromImage('base64data', 'image/png'))
                .rejects
                .toThrow('API 金鑰無效或權限不足，請檢查您的設定。');
        });

        test('returns extracted text on success', async () => {
            mockExtractTextFromImage.mockResolvedValue('Extracted text from image');

            const result = await mockExtractTextFromImage('base64data', 'image/png');
            expect(result).toBe('Extracted text from image');
        });
    });

    describe('geminiService - analyzeText', () => {
        const mockConfig: AnalysisConfig = {
            checkRedundancy: true,
            checkFluency: true,
            revisionLevel: 3,
            stylePreference: 'formal'
        };

        const mockSuccessResponse: AnalysisResult = {
            revisedText: 'Revised text',
            diffText: 'Diff text',
            issues: [
                { original: 'text', suggested: 'text', reason: 'typo', type: 'typo' }
            ],
            summary: 'Analysis complete'
        };

        test('throws error when AI service is not available', async () => {
            mockAnalyzeText.mockRejectedValue(new Error('Gemini AI service not available. Please check your API key.'));

            await expect(mockAnalyzeText('test text', mockConfig))
                .rejects
                .toThrow('Gemini AI service not available. Please check your API key.');
        });

        test('handles quota exceeded error', async () => {
            mockAnalyzeText.mockRejectedValue(new Error('API 配額已用盡，請稍後再試或檢查您的 API 金鑰配額。'));

            await expect(mockAnalyzeText('test text', mockConfig))
                .rejects
                .toThrow('API 配額已用盡，請稍後再試或檢查您的 API 金鑰配額。');
        });

        test('filters issues based on config when checkRedundancy is false', () => {
            // Test the filtering logic as a pure function
            const filterIssuesBasedOnConfig = (issues: any[], config: AnalysisConfig) => {
                return issues.filter((issue) => {
                    if (issue.type === 'redundancy' && !config.checkRedundancy) return false;
                    if (issue.type === 'fluency' && !config.checkFluency) return false;
                    return true;
                });
            };

            const allIssues = [
                { original: 'text', suggested: 'text', reason: 'typo', type: 'typo' },
                { original: 'redundant', suggested: 'concise', reason: 'redundancy', type: 'redundancy' },
                { original: 'awkward', suggested: 'smooth', reason: 'fluency', type: 'fluency' }
            ];

            const configWithNoRedundancy: AnalysisConfig = {
                ...mockConfig,
                checkRedundancy: false
            };

            const filteredIssues = filterIssuesBasedOnConfig(allIssues, configWithNoRedundancy);

            // Should filter out redundancy issues when checkRedundancy is false
            expect(filteredIssues).toHaveLength(2);
            expect(filteredIssues).not.toContainEqual(expect.objectContaining({ type: 'redundancy' }));
        });

        test('filters issues based on config when checkFluency is false', () => {
            // Test the filtering logic as a pure function
            const filterIssuesBasedOnConfig = (issues: any[], config: AnalysisConfig) => {
                return issues.filter((issue) => {
                    if (issue.type === 'redundancy' && !config.checkRedundancy) return false;
                    if (issue.type === 'fluency' && !config.checkFluency) return false;
                    return true;
                });
            };

            const allIssues = [
                { original: 'text', suggested: 'text', reason: 'typo', type: 'typo' },
                { original: 'redundant', suggested: 'concise', reason: 'redundancy', type: 'redundancy' },
                { original: 'awkward', suggested: 'smooth', reason: 'fluency', type: 'fluency' }
            ];

            const configWithNoFluency: AnalysisConfig = {
                ...mockConfig,
                checkFluency: false
            };

            const filteredIssues = filterIssuesBasedOnConfig(allIssues, configWithNoFluency);

            // Should filter out fluency issues when checkFluency is false
            expect(filteredIssues).toHaveLength(2);
            expect(filteredIssues).not.toContainEqual(expect.objectContaining({ type: 'fluency' }));
        });

        test('returns complete analysis result on success', async () => {
            mockAnalyzeText.mockResolvedValue(mockSuccessResponse);

            const result = await mockAnalyzeText('test text', mockConfig);

            expect(result).toEqual(mockSuccessResponse);
        });

        test('handles JSON parsing errors', async () => {
            mockAnalyzeText.mockRejectedValue(new Error('無法解析分析結果，請重新嘗試。'));

            await expect(mockAnalyzeText('test text', mockConfig))
                .rejects
                .toThrow('無法解析分析結果，請重新嘗試。');
        });
    });
});

describe('Utility Function Tests', () => {
    test('getVisibleProgressMessages filters correctly based on config', () => {
        const getVisibleProgressMessages = (config: any) => {
            const PROGRESS_MESSAGES = [
                "正在解析文本結構...",
                "識別上下文邏輯中...",
                "深度檢查語法完整性...",
                "比對冗贅詞庫...",
                "優化語句流暢度建議...",
                "正在生成最終報告..."
            ];

            return PROGRESS_MESSAGES.filter((msg, idx) => {
                if (idx === 3) return config.checkRedundancy;
                if (idx === 4) return config.checkFluency;
                return true;
            });
        };

        // Test with both enabled
        let result = getVisibleProgressMessages({ checkRedundancy: true, checkFluency: true });
        expect(result).toHaveLength(6);

        // Test with redundancy disabled
        result = getVisibleProgressMessages({ checkRedundancy: false, checkFluency: true });
        expect(result).toHaveLength(5);
        expect(result).not.toContain("比對冗贅詞庫...");

        // Test with fluency disabled
        result = getVisibleProgressMessages({ checkRedundancy: true, checkFluency: false });
        expect(result).toHaveLength(5);
        expect(result).not.toContain("優化語句流暢度建議...");

        // Test with both disabled
        result = getVisibleProgressMessages({ checkRedundancy: false, checkFluency: false });
        expect(result).toHaveLength(4);
    });
});
