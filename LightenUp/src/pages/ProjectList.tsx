import React, { useEffect, useState } from 'react'
import { Card, Button, List, Typography, Modal, Input, message, Popconfirm } from 'antd'
import { PlusOutlined, FolderOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { ProjectService } from '../api/apiService'
import { Project } from '../api/types'

const { Title } = Typography

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res = await ProjectService.listProjects()
      setProjects(res)
    } catch (error) {
      message.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newProjectName.trim()) return
    setCreating(true)
    try {
      const { projectId } = await ProjectService.createProject(newProjectName)
      message.success('Project created')
      setIsModalVisible(false)
      setNewProjectName('')
      navigate(`/editor/${projectId}`)
    } catch (error) {
      message.error('Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await ProjectService.deleteProject(id)
      message.success('Project deleted')
      fetchProjects()
    } catch (error) {
      message.error('Failed to delete project')
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>My Projects</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          New Project
        </Button>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 4 }}
        dataSource={projects}
        loading={loading}
        renderItem={(item) => (
          <List.Item>
            <Card
              hoverable
              onClick={() => navigate(`/editor/${item.id}`)}
              actions={[
                <span key="date">{new Date(item.updated_at).toLocaleDateString()}</span>,
                <Popconfirm
                    key="delete"
                    title="Are you sure to delete this project?"
                    onConfirm={(e) => {
                        e?.stopPropagation()
                        handleDelete(item.id)
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="Yes"
                    cancelText="No"
                >
                    <DeleteOutlined onClick={(e) => e.stopPropagation()} />
                </Popconfirm>
              ]}
            >
              <Card.Meta
                avatar={<FolderOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                title={item.name}
                description={`ID: ${item.id.slice(0, 8)}...`}
              />
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title="Create New Project"
        open={isModalVisible}
        onOk={handleCreate}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={creating}
      >
        <Input
          placeholder="Project Name"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          onPressEnter={handleCreate}
          autoFocus
        />
      </Modal>
    </div>
  )
}
