{{/*
  Expand the name of the chart.
  If nameOverride is set, use it; otherwise use .Chart.Name.
*/}}
{{- define "microservice.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
  Create a fully qualified app name.
  Format: <nameOverride or chart-name>
*/}}
{{- define "microservice.fullname" -}}
{{- include "microservice.name" . }}
{{- end }}

{{/*
  Common labels applied to ALL resources.
*/}}
{{- define "microservice.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
app.kubernetes.io/name: {{ include "microservice.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Values.image.tag | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
  Selector labels (subset of common labels for matchLabels).
*/}}
{{- define "microservice.selectorLabels" -}}
app.kubernetes.io/name: {{ include "microservice.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
  ConfigMap name.
*/}}
{{- define "microservice.configmapName" -}}
{{ include "microservice.fullname" . }}-config
{{- end }}

{{/*
  Secret name.
*/}}
{{- define "microservice.secretName" -}}
{{ include "microservice.fullname" . }}-secret
{{- end }}
