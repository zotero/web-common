import { useState, useCallback } from 'react';
import { Section } from '../section';
import { Tabs, Tab, TabPane } from '../../components/tabs';

export function TabsSection() {
	const [activeTab, setActiveTab] = useState('tab-1');
	const [compactTab, setCompactTab] = useState('compact-1');

	const handleActivate = useCallback((el) => {
		setActiveTab(el.dataset.tabId);
	}, []);

	const handleCompactActivate = useCallback((el) => {
		setCompactTab(el.dataset.tabId);
	}, []);

	return (
		<>
			<Section title="Tabs">
				<Tabs>
					<Tab
						isActive={ activeTab === 'tab-1' }
						onActivate={ handleActivate }
						data-tab-id="tab-1"
					>
						First
					</Tab>
					<Tab
						isActive={ activeTab === 'tab-2' }
						onActivate={ handleActivate }
						data-tab-id="tab-2"
					>
						Second
					</Tab>
					<Tab
						isActive={ activeTab === 'tab-3' }
						onActivate={ handleActivate }
						data-tab-id="tab-3"
					>
						Third
					</Tab>
				</Tabs>
				<TabPane isActive={ activeTab === 'tab-1' }>
					<p>Content for the first tab.</p>
				</TabPane>
				<TabPane isActive={ activeTab === 'tab-2' }>
					<p>Content for the second tab.</p>
				</TabPane>
				<TabPane isActive={ activeTab === 'tab-3' }>
					<p>Content for the third tab.</p>
				</TabPane>
			</Section>

			<Section title="Tabs (compact)">
				<Tabs compact>
					<Tab
						isActive={ compactTab === 'compact-1' }
						onActivate={ handleCompactActivate }
						data-tab-id="compact-1"
					>
						Alpha
					</Tab>
					<Tab
						isActive={ compactTab === 'compact-2' }
						onActivate={ handleCompactActivate }
						data-tab-id="compact-2"
					>
						Beta
					</Tab>
				</Tabs>
				<TabPane isActive={ compactTab === 'compact-1' }>
					<p>Alpha content.</p>
				</TabPane>
				<TabPane isActive={ compactTab === 'compact-2' }>
					<p>Beta content.</p>
				</TabPane>
			</Section>

			<Section title="Tabs (with disabled tab)">
				<Tabs>
					<Tab
						isActive={ true }
						onActivate={ () => {} }
					>
						Active
					</Tab>
					<Tab
						isActive={ false }
						isDisabled
						onActivate={ () => {} }
					>
						Disabled
					</Tab>
				</Tabs>
			</Section>
		</>
	);
}
