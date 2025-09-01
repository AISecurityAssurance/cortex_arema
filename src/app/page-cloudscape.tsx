"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  Container,
  Header,
  Button,
  SpaceBetween,
  Box,
  Cards,
  Grid,
  Link,
  Badge,
  ContentLayout,
  ColumnLayout
} from "@cloudscape-design/components";
import { SessionStorage } from "@/lib/storage/sessionStorage";

export default function HomePage() {
  const router = useRouter();

  const handleQuickStart = () => {
    const session = SessionStorage.createSession("Quick Start Session");
    router.push(`/analysis?session=${session.id}`);
  };

  const features = [
    {
      title: "Multi-Model Analysis",
      description: "Compare security findings from multiple AI models including Claude Opus and Sonnet for comprehensive coverage",
      icon: "🛡️"
    },
    {
      title: "Professional Validation", 
      description: "Structured validation workflow with multi-dimensional quality assessment and false positive tracking",
      icon: "✅"
    },
    {
      title: "Comprehensive Reports",
      description: "Generate detailed markdown reports with executive summaries, findings analysis, and actionable recommendations",
      icon: "📄"
    },
    {
      title: "Template Library",
      description: "Pre-built templates for STRIDE, STPA-SEC, and custom security analysis frameworks",
      icon: "📚"
    },
    {
      title: "Session Management",
      description: "Save, resume, and track multiple security analysis sessions with progress indicators",
      icon: "💾"
    },
    {
      title: "Architecture Integration",
      description: "Upload and analyze system architecture diagrams with threat annotations and visual mapping",
      icon: "🏗️"
    }
  ];

  const workflowSteps = [
    {
      title: "Choose Analysis Framework",
      description: "Select from STRIDE, STPA-SEC, or custom templates"
    },
    {
      title: "Describe Your System",
      description: "Provide system details and upload architecture diagrams"
    },
    {
      title: "AI Analysis",
      description: "Multiple models analyze your system for vulnerabilities"
    },
    {
      title: "Validate Findings",
      description: "Review and validate each finding with quality scores"
    },
    {
      title: "Generate Report",
      description: "Export comprehensive security assessment report"
    }
  ];

  return (
    <ContentLayout
      header={
        <SpaceBetween size="m">
          <Header
            variant="h1"
            description="Professional AI-powered security analysis sandbox platform for comprehensive threat modeling and vulnerability assessment"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button 
                  onClick={handleQuickStart} 
                  variant="primary"
                  iconName="security"
                >
                  Start Security Analysis
                </Button>
                <Button
                  onClick={() => router.push("/pipeline-editor")}
                  iconName="settings"
                >
                  Visual Pipeline Editor
                </Button>
              </SpaceBetween>
            }
          >
            Cortex Arena
          </Header>
        </SpaceBetween>
      }
    >
      <SpaceBetween size="xxl">
        {/* Features Section */}
        <Container
          header={
            <Header variant="h2" description="Comprehensive security analysis capabilities">
              Core Features
            </Header>
          }
        >
          <Cards
            items={features}
            cardDefinition={{
              header: item => (
                <Box>
                  <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                    <Box fontSize="heading-xl">{item.icon}</Box>
                    <Box fontWeight="bold">{item.title}</Box>
                  </SpaceBetween>
                </Box>
              ),
              sections: [
                {
                  content: item => item.description
                }
              ]
            }}
            cardsPerRow={[
              { cards: 1 },
              { minWidth: 500, cards: 2 },
              { minWidth: 768, cards: 3 }
            ]}
          />
        </Container>

        {/* Workflow Section */}
        <Container
          header={
            <Header variant="h2" description="Simple 5-step process for comprehensive security assessment">
              Security Analysis Workflow
            </Header>
          }
        >
          <ColumnLayout columns={5} variant="text-grid">
            {workflowSteps.map((step, index) => (
              <Box key={index}>
                <SpaceBetween size="xs">
                  <Badge color="blue">{`Step ${index + 1}`}</Badge>
                  <Box fontWeight="bold">{step.title}</Box>
                  <Box variant="small" color="text-status-inactive">
                    {step.description}
                  </Box>
                </SpaceBetween>
              </Box>
            ))}
          </ColumnLayout>
        </Container>

        {/* Supported Models Section */}
        <Container
          header={
            <Header variant="h2">
              Supported AI Models
            </Header>
          }
        >
          <ColumnLayout columns={3}>
            <Box>
              <Header variant="h3">AWS Bedrock</Header>
              <SpaceBetween size="xs">
                <Badge>Claude Opus</Badge>
                <Badge>Claude Sonnet</Badge>
                <Badge>Claude 3.5 Sonnet</Badge>
                <Badge>Nova Pro</Badge>
                <Badge>Nova Lite</Badge>
                <Badge>Llama 3.2</Badge>
                <Badge>Pixtral Large</Badge>
              </SpaceBetween>
            </Box>
            <Box>
              <Header variant="h3">Ollama (Local)</Header>
              <SpaceBetween size="xs">
                <Badge>Llava</Badge>
                <Badge>Llama 3.2</Badge>
                <Badge>Llama 3.2 Vision</Badge>
                <Badge>Qwen 2.5</Badge>
              </SpaceBetween>
            </Box>
            <Box>
              <Header variant="h3">Azure OpenAI</Header>
              <SpaceBetween size="xs">
                <Badge>GPT-4o</Badge>
                <Badge>GPT-4o Mini</Badge>
                <Badge>GPT-4 Vision</Badge>
                <Badge>GPT-4 Turbo</Badge>
                <Badge>O1 Preview</Badge>
                <Badge>O1 Mini</Badge>
              </SpaceBetween>
            </Box>
          </ColumnLayout>
        </Container>

        {/* Call to Action */}
        <Container>
          <Box textAlign="center" padding="xxl">
            <SpaceBetween size="m">
              <Header variant="h2">
                Ready to enhance your security posture?
              </Header>
              <Box variant="p" color="text-body-secondary">
                Start analyzing your systems with AI-powered security assessment
              </Box>
              <Box>
                <Button 
                  onClick={handleQuickStart} 
                  variant="primary"
                  iconAlign="right"
                  iconName="arrow-right"
                >
                  Get Started Now
                </Button>
              </Box>
            </SpaceBetween>
          </Box>
        </Container>
      </SpaceBetween>
    </ContentLayout>
  );
}