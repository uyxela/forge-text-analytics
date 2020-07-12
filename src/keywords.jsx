import ForgeUI, { render, Fragment, Macro, Text, Table, Head, Cell, Row, useProductContext, useState } from "@forge/ui";
import api from '@forge/api';

const URL = 'https://api.us-east.natural-language-understanding.watson.cloud.ibm.com/instances/871f5fce-98dd-4dc9-b77d-e28dc429866f';

async function getAnalysis(contentId) {
    const contentResponse = await api.asApp().requestConfluence(`/rest/api/content/${contentId}?expand=body.storage`);
    await checkResponse('Confluence API', contentResponse);
    const contentData = await contentResponse.json();
    const content = contentData.body.storage.value;

    const keywordResponse = await api.fetch(`${URL}/v1/analyze?version=2019-07-12`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`apikey:${process.env.NLU_API_KEY}`).toString('base64')}`,
        },
        body: JSON.stringify({
            "html": content,
            "features": {
                "keywords": {
                    "sentiment": true,
                    "emotion": true,
                    "limit": 3
                }
            }
        })
    });
    await checkResponse('IBM Natural Language Understanding API', keywordResponse);
    const keywordData = await keywordResponse.json();
    return keywordData;
}

function showAnalysis(value) {
    const keywords = value.keywords;
    return (
        <Table>
            <Head>
                <Cell>
                    <Text content="Keyword" />
                </Cell>
                <Cell>
                    <Text content="Relevance" />
                </Cell>
                <Cell>
                    <Text content="Sentiment Score" />
                </Cell>
                <Cell>
                    <Text content="Emotion" />
                </Cell>
            </Head>
            {keywords.map(keyword => <Row>
                <Cell>
                    <Text>{keyword.text}</Text>
                </Cell>
                <Cell>
                    <Text>{Math.round(keyword.relevance * 10000) / 100}%</Text>
                </Cell>
                <Cell>
            <Text>{firstLetterUpper(keyword.sentiment.label)}: {Math.round(keyword.sentiment.score * 10000) / 100}%</Text>
                </Cell>
                <Cell>
                    <Text>{firstLetterUpper(Object.keys(keyword.emotion).reduce((a, b) => keyword.emotion[a] > keyword.emotion[b] ? a : b))}: {Math.round(Math.max(keyword.emotion.sadness , keyword.emotion.joy , keyword.emotion.fear , keyword.emotion.disgust , keyword.emotion.anger) * 10000) / 100}%</Text>
                </Cell>
            </Row>)}
        </Table>
    )
}

const firstLetterUpper = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const Keywords = () => {

    const { context, contentId } = useProductContext();
    const [value, setValue] = useState(getAnalysis(contentId));

    return (
        <Fragment>
            {showAnalysis(value)}
        </Fragment>
    );
};

async function checkResponse(apiName, response) {
    if (!response.ok) {
        const message = `Error from ${apiName}: ${response.status} ${await response.text()}`;
        console.error(message);
        throw new Error(message);
    }
}

export const run = render(
    <Macro
        app={<Keywords />}
    />
);