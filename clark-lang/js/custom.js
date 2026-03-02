// Custom JS for docs overview toggle
document.addEventListener('DOMContentLoaded', function() {
  const indicators = document.querySelectorAll('.docs-stack-indicator');
  
  indicators.forEach(indicator => {
    indicator.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const stack = this.closest('.docs-stack');
      stack.classList.toggle('expanded');
    });
  });

  // Expand all toggle
  const expandAllButton = document.getElementById('expand-all');
  if (expandAllButton) {
    let allExpanded = false;

    expandAllButton.addEventListener('click', function() {
      const stacks = document.querySelectorAll('.docs-stack');
      stacks.forEach(stack => {
        if (stack.querySelector('.docs-children .docs-card-link')) {
          if (allExpanded) {
            stack.classList.remove('expanded');
          } else {
            stack.classList.add('expanded');
          }
        }
      });
      allExpanded = !allExpanded;
      expandAllButton.textContent = allExpanded ? 'Collapse Everything' : 'Expand Everything';
    });
  }

  // Search functionality
  const searchInputs = [
    document.getElementById('docs-search'), // sidebar search
    document.getElementById('docs-search-overview') // overview search
  ].filter(Boolean);

  searchInputs.forEach(searchInput => {
    const searchButton = searchInput.nextElementSibling?.querySelector('.input-group-text');
    const searchIcon = searchButton?.querySelector('i');

    function performSearch() {
      const query = searchInput.value.trim();
      if (query) {
        // Use defined_searchURL set by Hugo template, fall back to /search/
        const searchBase = (typeof defined_searchURL !== 'undefined') ? defined_searchURL : '/search/';
        window.location.href = searchBase + '?q=' + encodeURIComponent(query);
      }
    }

    // Enter key in input
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });

    // Click on search button/icon
    if (searchButton) {
      searchButton.addEventListener('click', performSearch);
    }
    if (searchIcon) {
      searchIcon.addEventListener('click', performSearch);
    }
  });

  // Code example toggle functionality
  const codeExamples = document.querySelectorAll('.parting-code-example');

  codeExamples.forEach((example, index) => {
    const toggleButtons = example.querySelectorAll('.code-toggle-btn');
    const highlightDiv = example.querySelector('.highlight');
    const preElement = example.querySelector('pre.chroma') || example.querySelector('pre');
    
    toggleButtons.forEach((button, btnIndex) => {
      function handleToggle(e) {
        e.preventDefault();
        e.stopPropagation();
        const toggleType = this.getAttribute('data-toggle');
        
        // Remove active class from all buttons of same type
        toggleButtons.forEach(btn => {
          if (btn.getAttribute('data-toggle') === toggleType) {
            btn.classList.remove('active');
          }
        });
        
        // Toggle functionality based on type
        switch(toggleType) {
          case 'line-numbers':
            if (highlightDiv) {
              highlightDiv.classList.toggle('show-line-numbers');
              // Set button active state based on whether line numbers are now shown
              const lineNumbersShown = highlightDiv.classList.contains('show-line-numbers');
              this.classList.toggle('active', lineNumbersShown);
            }
            break;
          case 'wrap':
            if (preElement) {
              preElement.classList.toggle('word-wrap');
              // Set button active state based on whether word wrap is now enabled
              const wordWrapEnabled = preElement.classList.contains('word-wrap');
              this.classList.toggle('active', wordWrapEnabled);
            }
            break;
          case 'copy':
            let codeText = '';
            if (preElement) {
              // Find the code element within the pre
              const codeElement = preElement.querySelector('code');
              if (codeElement) {
                // Get the raw text content
                const rawText = codeElement.textContent;
                
                // Split by newlines and clean up line numbers
                const lines = rawText.split('\n');
                const cleanLines = lines.map(line => {
                  // Remove line numbers from the beginning of each line
                  // Pattern: digits followed by the actual content
                  return line.replace(/^\d+/, '').trim();
                }).filter(line => line.length > 0); // Remove empty lines
                
                codeText = cleanLines.join('\n');
              } else {
                // Fallback: use pre element's text content
                codeText = preElement.textContent;
              }
            }
            navigator.clipboard.writeText(codeText).then(() => {
              // Visual feedback
              const originalIcon = this.querySelector('i');
              const originalClass = originalIcon.className;
              originalIcon.className = 'fas fa-check';
              this.classList.add('active');
              
              setTimeout(() => {
                originalIcon.className = originalClass;
                this.classList.remove('active');
              }, 1000);
            });
            break;
          case 'explainer':
            const example = this.closest('.parting-code-example');
            const explainer = example.querySelector('.code-explainer');
            if (explainer) {
              explainer.classList.toggle('hidden');
              // Set button active state based on whether explainer is now visible
              const explainerVisible = !explainer.classList.contains('hidden');
              this.classList.toggle('active', explainerVisible);
            }
            break;
        }
      }
      
      // Add both click and touch events for mobile compatibility
      button.addEventListener('click', handleToggle);
      button.addEventListener('touchstart', handleToggle);
    });
  });
});

// Theme toggle functionality disabled: always use light theme
// and keep the moon icon for appearance only.
document.addEventListener('DOMContentLoaded', function() {
  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    themeIcon.className = 'fas fa-moon';
  }

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    // show playful message instead of toggling
    themeToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      alert("Dark-Mode Coming 'Soonish'. lol");
    });
  }

  // Popout modal functionality
  const popoutButtons = document.querySelectorAll('.popout-button');
  popoutButtons.forEach(button => {
    button.addEventListener('click', function() {
      const releaseId = this.getAttribute('data-release-id');
      openPopoutModal(releaseId);
    });
  });

  // Close modal when clicking outside
  document.getElementById('popout-modal').addEventListener('click', function(e) {
    if (e.target === this) {
      closePopoutModal();
    }
  });

  // Close modal on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('popout-modal').classList.contains('active')) {
      closePopoutModal();
    }
  });
});

// Popout modal functions
function openPopoutModal(releaseId) {
  const modal = document.getElementById('popout-modal');
  if (!modal) return;
  
  const hierarchyContainer = document.getElementById('popout-hierarchy');
  
  // Find the release element
  const releaseElement = document.querySelector(`button[data-release-id="${releaseId}"]`);
  
  if (!releaseElement) {
    hierarchyContainer.innerHTML = '<p>Error: Release element not found for ID: ' + releaseId + '</p>';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    return;
  }
  
  // Find the parent details element
  const detailsElement = releaseElement.closest('details');
  
  if (!detailsElement) {
    hierarchyContainer.innerHTML = '<p>Error: Details element not found</p>';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    return;
  }
  
  // Clone the details element and its children
  const clonedDetails = detailsElement.cloneNode(true);
  
  // Remove the popout button from the clone to avoid recursion
  const popoutBtn = clonedDetails.querySelector('.popout-button');
  if (popoutBtn) {
    popoutBtn.parentElement.removeChild(popoutBtn);
  }
  
  // Clear previous content
  hierarchyContainer.innerHTML = '';
  
  // Add the cloned hierarchy
  hierarchyContainer.appendChild(clonedDetails);
  
  // Expand all nested details for better visibility
  const allDetails = hierarchyContainer.querySelectorAll('details');
  allDetails.forEach(detail => {
    detail.setAttribute('open', '');
  });
  
  // Show modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePopoutModal() {
  const modal = document.getElementById('popout-modal');
  modal.classList.remove('active');
  document.body.style.overflow = ''; // Restore scrolling
}